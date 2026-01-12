import React, { useState, useEffect } from 'react';
import { FileText, Loader2, Info, Save, FolderOpen, Download, TrendingUp, Target, RefreshCw, Sliders, Building, Wrench, ThumbsUp, ThumbsDown, Plus, Trash2, Moon, Sun, Share2, Link, Copy, Check, LogIn, LogOut, User, Cloud, CloudOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { AuthProvider, useAuth } from './AuthContext';
import { useKalkyler } from './useKalkyler';
import LoginModal from './LoginModal';

// Formatera tal med mellanslag som tusenseparator
const formatNumber = (num) => {
  if (num === 0 || num === '' || num === null || num === undefined) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// Parsa tal med mellanslag
const parseFormattedNumber = (str) => {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/\s/g, '')) || 0;
};

// InputField definierad UTANFÖR huvudkomponenten för att undvika fokusproblem
const InputField = ({ label, value, field, suffix = '', tooltip = '', isCompare = false, onValueChange, disabled = false, darkMode = false }) => (
  <div className={`mb-3 ${disabled ? 'opacity-50' : ''}`}>
    <label className={`block text-sm font-medium mb-1 flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {label}
      {tooltip && (
        <div className="relative group">
          <Info size={14} className={darkMode ? 'text-gray-500 cursor-help' : 'text-gray-400 cursor-help'} />
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
            {tooltip}
          </div>
        </div>
      )}
    </label>
    <div className="flex items-center">
      <input
        type="text"
        inputMode="numeric"
        value={formatNumber(value)}
        onChange={(e) => onValueChange(field, parseFormattedNumber(e.target.value), isCompare)}
        disabled={disabled}
        placeholder="0"
        className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
          disabled 
            ? darkMode ? 'bg-gray-700 cursor-not-allowed text-gray-500 border-gray-600' : 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-300'
            : darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
        }`}
      />
      {suffix && <span className={`ml-2 text-sm min-w-[24px] ${disabled ? 'text-gray-400' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{suffix}</span>}
    </div>
  </div>
);

// ResultRow komponent
const ResultRow = ({ label, value, highlight = false, compareValue = null, negative = false, darkMode = false }) => (
  <div className={`flex justify-between items-center py-2 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'} ${highlight ? darkMode ? 'bg-blue-900/30 -mx-2 px-2 rounded' : 'bg-blue-50 -mx-2 px-2 rounded' : ''}`}>
    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
    <div className="flex gap-4">
      <span className={`text-sm font-medium ${highlight ? darkMode ? 'text-blue-400' : 'text-blue-700' : negative ? 'text-red-500' : darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</span>
      {compareValue !== null && (
        <span className={`text-sm font-medium ${highlight ? 'text-green-400' : 'text-green-500'}`}>{compareValue}</span>
      )}
    </div>
  </div>
);

const FastighetsKalkylInner = () => {
  const [pasteText, setPasteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('kalkyl');
  const [compareMode, setCompareMode] = useState(false);
  
  // Auth
  const { user, loading: authLoading, signOut } = useAuth();
  const { kalkyler: savedCalcs, loading: calcsLoading, syncing, saveKalkyl, deleteKalkyl, syncLocalToCloud } = useKalkyler();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Dark mode
  const [darkMode, setDarkMode] = useState(false);
  
  // Hyresinmatning - månad eller år
  const [hyresInput, setHyresInput] = useState('ar'); // 'ar' eller 'manad'
  
  // Individuella hyror för lägenheter/lokaler
  const [useIndividualRents, setUseIndividualRents] = useState(false);
  const [lagenhetsHyror, setLagenhetsHyror] = useState([]);
  const [lokalHyror, setLokalHyror] = useState([]);
  
  // Delningslänk
  const [shareLink, setShareLink] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Scenario-läge
  const [scenario, setScenario] = useState('normal');
  
  // Sparfunktioner (ersätter gamla savedCalcs state)
  const [saveName, setSaveName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Synka lokala kalkyler till molnet efter inloggning
  useEffect(() => {
    if (user) {
      syncLocalToCloud();
    }
  }, [user]);
  
  // Ränta-slider
  const [sliderRanta, setSliderRanta] = useState(4.5);
  
  // Alternativinvestering
  const [borsAvkastning, setBorsAvkastning] = useState(7);

  // Fördelar och nackdelar
  const [fordelar, setFordelar] = useState(['']);
  const [nackdelar, setNackdelar] = useState(['']);

  // Dynamiska renoveringskostnader
  const [renoveringar, setRenoveringar] = useState([
    { id: 1, namn: '', kostnad: 0 }
  ]);
  const [renoveringBelastarDrift, setRenoveringBelastarDrift] = useState(false);
  
  // Ladda dark mode från localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('fastx_darkmode');
    if (savedDarkMode === 'true') {
      setDarkMode(true);
    }
  }, []);
  
  // Spara dark mode till localStorage
  useEffect(() => {
    localStorage.setItem('fastx_darkmode', darkMode.toString());
  }, [darkMode]);
  
  // Demo-kalkyl som kan laddas in
  const demoKalkyl = {
    id: 'demo',
    name: 'Demo-kalkyl',
    data: {
      fastighetspris: 1500000,
      antalLagenheter: 4,
      antalLokaler: 0,
      bruksarea: 420,
      bruksareaLokal: 0,
      bruksareaLagenhet: 420,
      hyresintakterAr: 240000,
      driftkostnaderSaljare: 111434,
      kopareTyp: 'bolag',
      stampelskattBolagProcent: 4.25,
      stampelskattPrivatProcent: 1.5,
      pantbrevsavgiftProcent: 2.0,
      besiktningskostnad: 15000,
      befintligaPantbrev: 0,
      renoveringVarmepump: 0,
      renoveringSpis: 0,
      renoveringYtskikt: 0,
      renoveringFasad: 0,
      renoveringTradgard: 0,
      renoveringOvrigt: 0,
      egetKapitalProcent: 25,
      ranta: 3.5,
      amorteringProcent: 2,
      vakansgrad: 0,
      vardeokning: 2,
      bolagsskattProcent: 20.6
    },
    renoveringar: [
      { id: 1, namn: 'Värmepump', kostnad: 80000 },
      { id: 2, namn: 'Ytskikt lägenheter', kostnad: 50000 },
      { id: 3, namn: 'Fasadmålning', kostnad: 40000 }
    ],
    renoveringBelastarDrift: false,
    fordelar: ['Bra läge nära centrum', 'Stabila hyresgäster', 'Låg vakansrisk'],
    nackdelar: ['Behöver ny värmepump', 'Äldre elinstallation'],
    timestamp: new Date().toISOString(),
    isDemo: true
  };
  
  const [data, setData] = useState({
    // Grunddata
    fastighetspris: 0,
    antalLagenheter: 0,
    antalLokaler: 0,
    bruksarea: 0,
    bruksareaLokal: 0,
    bruksareaLagenhet: 0,
    
    // Hyresintäkter
    hyresintakterAr: 0,
    
    // Driftkostnader från säljare
    driftkostnaderSaljare: 0,
    
    // Engångskostnader
    kopareTyp: 'bolag', // 'bolag' eller 'privat'
    stampelskattBolagProcent: 4.25,
    stampelskattPrivatProcent: 1.5,
    pantbrevsavgiftProcent: 2.0,
    besiktningskostnad: 0,
    befintligaPantbrev: 0,
    
    // Renoveringskostnader
    renoveringVarmepump: 0,
    renoveringSpis: 0,
    renoveringYtskikt: 0,
    renoveringFasad: 0,
    renoveringTradgard: 0,
    renoveringOvrigt: 0,
    
    // Finansiering
    egetKapitalProcent: 25,
    ranta: 4.5,
    amorteringProcent: 2,
    
    // För beräkningar
    vakansgrad: 0,
    vardeokning: 2,
    
    // Bolagsskatt
    bolagsskattProcent: 20.6
  });

  const [compareData, setCompareData] = useState({
    fastighetspris: 0, lagfart: 0, pantbrev: 0, maklararvode: 0,
    egetKapital: 0, ranta: 4.5, amorteringstid: 30, manadshyra: 0,
    vakansgrad: 5, fastighetsskatt: 0, underhall: 0, forsakring: 0,
    ovrigaKostnader: 0, vardeokning: 2
  });

  // Beräkna alla nyckeltal
  const calculateMetrics = (d, dynamicRenoveringar = []) => {
    // Engångskostnader
    const stampelskattProcent = d.kopareTyp === 'bolag' ? d.stampelskattBolagProcent : d.stampelskattPrivatProcent;
    const stampelskatt = d.fastighetspris * (stampelskattProcent / 100);
    const nyaPantbrev = Math.max(0, d.fastighetspris - d.befintligaPantbrev);
    const pantbrevsavgift = nyaPantbrev * (d.pantbrevsavgiftProcent / 100);
    const totalaEngangskostnader = stampelskatt + pantbrevsavgift + d.besiktningskostnad;
    
    // Renoveringskostnader - använd dynamiska renoveringar
    const totalaRenoveringskostnader = dynamicRenoveringar.reduce((sum, r) => sum + (r.kostnad || 0), 0);
    
    // Finansiering
    const egetKapital = d.fastighetspris * (d.egetKapitalProcent / 100);
    const lanebelopp = d.fastighetspris * ((100 - d.egetKapitalProcent) / 100);
    const belaning = 100 - d.egetKapitalProcent;
    
    // Räntekostnad och amortering per år
    const rantekostnadAr = lanebelopp * (d.ranta / 100);
    const amorteringAr = lanebelopp * (d.amorteringProcent / 100);
    
    // Hyresintäkter med vakans
    const hyresintakterNetto = d.hyresintakterAr * (1 - d.vakansgrad / 100);
    
    // Driftnetto (NOI) baserat på säljarens info
    const driftnettoSaljare = hyresintakterNetto - d.driftkostnaderSaljare;
    
    // Bankens schabloner
    const schablon50Procent = d.hyresintakterAr * 0.5; // 50% av hyra = driftkostnader
    const driftnetto50Procent = hyresintakterNetto - schablon50Procent;
    
    const schablonKvmKostnad = 420; // kr per kvm
    const schablonKvm = d.bruksarea * schablonKvmKostnad;
    const driftnettoSchablon = hyresintakterNetto - schablonKvm;
    
    // Direktavkastning
    const direktavkastning = (driftnettoSaljare / d.fastighetspris) * 100;
    
    // Cashflow beräkningar (före skatt)
    const cashflowSaljare = driftnettoSaljare - rantekostnadAr - amorteringAr;
    const cashflow50Procent = driftnetto50Procent - rantekostnadAr - amorteringAr;
    const cashflowSchablon = driftnettoSchablon - rantekostnadAr - amorteringAr;
    
    // Betalnetto (kassaflöde efter ränta/amortering men före skatt)
    const betalnettoSaljare = driftnettoSaljare - rantekostnadAr - amorteringAr;
    const betalnetto50Procent = driftnetto50Procent - rantekostnadAr - amorteringAr;
    const betalnettoSchablon = driftnettoSchablon - rantekostnadAr - amorteringAr;
    
    // Resultat efter bolagsskatt
    const resultatForSkattSaljare = driftnettoSaljare - rantekostnadAr; // amortering är ej avdragsgill
    const skattSaljare = Math.max(0, resultatForSkattSaljare * (d.bolagsskattProcent / 100));
    const cashflowEfterSkattSaljare = betalnettoSaljare - skattSaljare + amorteringAr; // lägg tillbaka amortering för kassaflöde
    
    const resultatForSkatt50 = driftnetto50Procent - rantekostnadAr;
    const skatt50 = Math.max(0, resultatForSkatt50 * (d.bolagsskattProcent / 100));
    const cashflowEfterSkatt50 = betalnetto50Procent - skatt50 + amorteringAr;
    
    const resultatForSkattSchablon = driftnettoSchablon - rantekostnadAr;
    const skattSchablon = Math.max(0, resultatForSkattSchablon * (d.bolagsskattProcent / 100));
    const cashflowEfterSkattSchablon = betalnettoSchablon - skattSchablon + amorteringAr;
    
    // Cash-on-Cash avkastning (CoC)
    const cocSaljare = egetKapital > 0 ? (betalnettoSaljare / egetKapital) * 100 : 0;
    const coc50Procent = egetKapital > 0 ? (betalnetto50Procent / egetKapital) * 100 : 0;
    const cocSchablon = egetKapital > 0 ? (betalnettoSchablon / egetKapital) * 100 : 0;
    
    // Ackumulerat kassaflöde över 5 år (efter skatt)
    const ackumuleratCashflow = [];
    for (let year = 1; year <= 5; year++) {
      ackumuleratCashflow.push({
        year,
        saljare: Math.round(cashflowEfterSkattSaljare * year),
        procent50: Math.round(cashflowEfterSkatt50 * year),
        schablon: Math.round(cashflowEfterSkattSchablon * year)
      });
    }
    
    return {
      // Engångskostnader
      stampelskatt,
      pantbrevsavgift,
      totalaEngangskostnader,
      
      // Renovering
      totalaRenoveringskostnader,
      
      // Finansiering
      egetKapital,
      lanebelopp,
      belaning,
      rantekostnadAr,
      amorteringAr,
      
      // Driftnetto
      driftnettoSaljare,
      driftnetto50Procent,
      driftnettoSchablon,
      schablon50Procent,
      schablonKvm,
      
      // Direktavkastning
      direktavkastning,
      
      // Cashflow (före skatt)
      cashflowSaljare,
      cashflow50Procent,
      cashflowSchablon,
      
      // Betalnetto
      betalnettoSaljare,
      betalnetto50Procent,
      betalnettoSchablon,
      
      // Efter skatt
      cashflowEfterSkattSaljare,
      cashflowEfterSkatt50,
      cashflowEfterSkattSchablon,
      
      // CoC
      cocSaljare,
      coc50Procent,
      cocSchablon,
      
      // Ackumulerat
      ackumuleratCashflow,
      
      // Hyra
      hyresintakterNetto
    };
  };

  // Break-even beräkningar
  const calculateBreakEven = (d, metrics) => {
    // Minsta hyra för break-even med säljarens driftkostnader
    const fixaKostnader = d.driftkostnaderSaljare + metrics.rantekostnadAr + metrics.amorteringAr;
    const minHyraAr = fixaKostnader / (1 - d.vakansgrad / 100);
    const minHyraMånad = minHyraAr / 12;
    
    // Max ränta för break-even
    let maxRanta = d.ranta;
    for (let testRanta = d.ranta; testRanta <= 15; testRanta += 0.1) {
      const testRantekostnad = metrics.lanebelopp * (testRanta / 100);
      const testCashflow = metrics.driftnettoSaljare - testRantekostnad - metrics.amorteringAr;
      if (testCashflow >= 0) {
        maxRanta = testRanta;
      } else {
        break;
      }
    }
    
    // Max vakans för break-even
    let maxVakans = d.vakansgrad;
    for (let testVakans = d.vakansgrad; testVakans <= 100; testVakans += 1) {
      const testHyra = d.hyresintakterAr * (1 - testVakans / 100);
      const testDriftnetto = testHyra - d.driftkostnaderSaljare;
      const testCashflow = testDriftnetto - metrics.rantekostnadAr - metrics.amorteringAr;
      if (testCashflow >= 0) {
        maxVakans = testVakans;
      } else {
        break;
      }
    }
    
    return { minHyraMånad, maxRanta, maxVakans };
  };

  // Tidslinje-data
  const generateTimelineData = (d, m) => {
    const timeline = [];
    let fastighetsvarde = d.fastighetspris;
    let kvarstaeandeLan = m.lanebelopp;
    let borsVarde = m.egetKapital;
    
    for (let year = 0; year <= 20; year++) {
      if (year > 0) {
        kvarstaeandeLan = Math.max(0, kvarstaeandeLan - m.amorteringAr);
        fastighetsvarde *= (1 + d.vardeokning / 100);
        borsVarde *= (1 + borsAvkastning / 100);
      }
      
      const egetKapitalIFastighet = fastighetsvarde - kvarstaeandeLan;
      const ackumuleratKassaflode = m.cashflowEfterSkattSaljare * year;
      const totaltKapital = egetKapitalIFastighet + ackumuleratKassaflode;
      
      timeline.push({
        year, 
        fastighetsvarde: Math.round(fastighetsvarde),
        kvarstaeandeLan: Math.round(kvarstaeandeLan),
        egetKapital: Math.round(egetKapitalIFastighet),
        kassaflode: Math.round(ackumuleratKassaflode),
        totaltKapital: Math.round(totaltKapital),
        borsVarde: Math.round(borsVarde)
      });
    }
    return timeline;
  };

  // Ränta-känslighets data
  const generateRantaSliderData = (d, m) => {
    const dataPoints = [];
    for (let r = 1; r <= 10; r += 0.5) {
      const testRantekostnad = m.lanebelopp * (r / 100);
      const testCashflow = m.driftnettoSaljare - testRantekostnad - m.amorteringAr;
      dataPoints.push({
        ranta: r,
        kassaflode: Math.round(testCashflow / 12),
        isCurrentRanta: Math.abs(r - d.ranta) < 0.25
      });
    }
    return dataPoints;
  };

  // Beräkna total hyra från individuella hyror
  const calculateTotalRent = () => {
    if (!useIndividualRents) return data.hyresintakterAr;
    
    const lagenhetTotal = lagenhetsHyror.reduce((sum, h) => sum + (h.hyra || 0), 0) * 12;
    const lokalTotal = lokalHyror.reduce((sum, h) => sum + (h.hyra || 0), 0) * 12;
    return lagenhetTotal + lokalTotal;
  };

  // Skapa en effektiv datastruktur för beräkningar som inkluderar individuella hyror
  const effectiveData = {
    ...data,
    hyresintakterAr: useIndividualRents ? calculateTotalRent() : data.hyresintakterAr
  };

  const metrics = calculateMetrics(effectiveData, renoveringar);
  const breakEven = calculateBreakEven(effectiveData, metrics);
  const isFullyOwnedCapital = data.egetKapitalProcent >= 100;
  const timelineData = generateTimelineData(effectiveData, metrics);
  const rantaSliderData = generateRantaSliderData(effectiveData, metrics);

  // Refinansiering
  const calculateRefinancing = (d, m, years) => {
    let fastighetsvarde = d.fastighetspris;
    let kvarstaeandeLan = m.lanebelopp;
    
    for (let year = 0; year < years; year++) {
      kvarstaeandeLan = Math.max(0, kvarstaeandeLan - m.amorteringAr);
      fastighetsvarde *= (1 + d.vardeokning / 100);
    }
    
    const maxBelaning70 = fastighetsvarde * 0.7;
    const frigjortKapital = Math.max(0, maxBelaning70 - kvarstaeandeLan);
    
    return {
      fastighetsvarde,
      kvarstaeandeLan,
      maxBelaning70,
      frigjortKapital,
      egetKapitalIFastighet: fastighetsvarde - kvarstaeandeLan
    };
  };

  const refinancing5 = calculateRefinancing(data, metrics, 5);
  const refinancing10 = calculateRefinancing(data, metrics, 10);

  // Spara kalkyl (nu via useKalkyler hook)
  const saveCalculation = async () => {
    if (!saveName.trim()) return;
    
    const newCalc = {
      name: saveName,
      data: { ...data },
      renoveringar: [...renoveringar],
      renoveringBelastarDrift,
      fordelar: [...fordelar],
      nackdelar: [...nackdelar]
    };
    
    const { error: saveError } = await saveKalkyl(newCalc);
    
    if (saveError) {
      setError('❌ Kunde inte spara: ' + saveError.message);
      setTimeout(() => setError(''), 4000);
    } else {
      setSaveName('');
      setShowSaveDialog(false);
      setError(user ? '✓ Kalkyl sparad till molnet!' : '✓ Kalkyl sparad lokalt!');
      setTimeout(() => setError(''), 2000);
    }
  };

  // Ladda kalkyl
  const loadCalculation = (calc) => {
    setData(calc.data);
    if (calc.fordelar) setFordelar(calc.fordelar);
    if (calc.nackdelar) setNackdelar(calc.nackdelar);
    if (calc.renoveringar) setRenoveringar(calc.renoveringar);
    if (calc.renoveringBelastarDrift !== undefined) setRenoveringBelastarDrift(calc.renoveringBelastarDrift);
    setError(`✓ Laddade "${calc.name}"`);
    setTimeout(() => setError(''), 2000);
  };

  // Ta bort kalkyl (nu via useKalkyler hook)
  const deleteCalculation = async (id) => {
    if (id === 'demo') return;
    const { error: deleteError } = await deleteKalkyl(id);
    if (deleteError) {
      setError('❌ Kunde inte ta bort: ' + deleteError.message);
      setTimeout(() => setError(''), 4000);
    }
  };

  // Exportera till PDF (öppnar print-dialog)
  const exportToPDF = () => {
    const reportDate = new Date().toLocaleDateString('sv-SE');
    
    // Beräkna payoff-tid för rapporten
    const totalInvesteringBelanat = metrics.egetKapital + metrics.totalaEngangskostnader + metrics.totalaRenoveringskostnader;
    const payoffTid = metrics.cashflowEfterSkattSaljare > 0 
      ? (totalInvesteringBelanat / metrics.cashflowEfterSkattSaljare).toFixed(1) + ' år' 
      : '∞';
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>FastX - Investeringsanalys</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #333; line-height: 1.4; }
    .page { padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; }
    .header .logo { font-size: 32px; font-weight: 800; color: #1e3a5f; letter-spacing: -1px; }
    .header .logo span { color: #f97316; }
    .header .subtitle { color: #64748b; font-size: 12px; margin-top: 5px; }
    .header .date { color: #94a3b8; font-size: 10px; margin-top: 5px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; font-weight: bold; color: #1e3a5f; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .card { background: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; }
    .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e2e8f0; }
    .row:last-child { border-bottom: none; }
    .row-label { color: #64748b; }
    .row-value { font-weight: 600; color: #1e293b; }
    .row-value.positive { color: #16a34a; }
    .row-value.negative { color: #dc2626; }
    .highlight-box { background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: white; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
    .highlight-box .big-number { font-size: 28px; font-weight: bold; }
    .highlight-box .label { font-size: 11px; opacity: 0.9; margin-top: 5px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
    .kpi { background: #f1f5f9; border-radius: 6px; padding: 12px; text-align: center; }
    .kpi-value { font-size: 18px; font-weight: bold; color: #1e3a5f; }
    .kpi-label { font-size: 9px; color: #64748b; margin-top: 3px; }
    .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .table th, .table td { padding: 8px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .table th { background: #f1f5f9; font-weight: 600; color: #475569; font-size: 10px; }
    .table td { font-size: 10px; }
    .table .right { text-align: right; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 9px; }
    .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
    .pros { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; }
    .cons { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; }
    .pros-title { color: #16a34a; font-weight: bold; margin-bottom: 10px; }
    .cons-title { color: #dc2626; font-weight: bold; margin-bottom: 10px; }
    .list-item { padding: 3px 0; padding-left: 15px; position: relative; }
    .list-item:before { content: "•"; position: absolute; left: 0; }
    .renovation-list { margin-top: 10px; }
    .renovation-item { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px; }
    @media print { .page { padding: 20px; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="logo">Fast<span>X</span></div>
      <div class="subtitle">Investeringsanalys</div>
      <div class="date">Genererad: ${reportDate}</div>
    </div>
    
    <div class="highlight-box">
      <div class="big-number">${formatCurrency(data.fastighetspris)}</div>
      <div class="label">Fastighetspris</div>
    </div>
    
    <div class="kpi-grid">
      <div class="kpi">
        <div class="kpi-value">${metrics.direktavkastning.toFixed(2)}%</div>
        <div class="kpi-label">Direktavkastning</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${metrics.cocSaljare.toFixed(1)}%</div>
        <div class="kpi-label">Cash-on-Cash</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${formatCurrency(metrics.cashflowEfterSkattSaljare)}</div>
        <div class="kpi-label">Kassaflöde/år</div>
      </div>
      <div class="kpi">
        <div class="kpi-value">${payoffTid}</div>
        <div class="kpi-label">Payoff-tid</div>
      </div>
    </div>
    
    <div class="grid">
      <div class="section">
        <div class="section-title">🏠 Grunddata</div>
        <div class="card">
          <div class="row"><span class="row-label">Antal lägenheter</span><span class="row-value">${data.antalLagenheter} st</span></div>
          <div class="row"><span class="row-label">Antal lokaler</span><span class="row-value">${data.antalLokaler} st</span></div>
          <div class="row"><span class="row-label">Bruksarea</span><span class="row-value">${data.bruksarea} m²</span></div>
          <div class="row"><span class="row-label">Hyresintäkter/år</span><span class="row-value">${formatCurrency(data.hyresintakterAr)}</span></div>
          <div class="row"><span class="row-label">Driftkostnader/år</span><span class="row-value">${formatCurrency(data.driftkostnaderSaljare)}</span></div>
          <div class="row"><span class="row-label">Driftnetto (NOI)</span><span class="row-value">${formatCurrency(metrics.driftnettoSaljare)}</span></div>
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">💰 Finansiering</div>
        <div class="card">
          <div class="row"><span class="row-label">Eget kapital (${data.egetKapitalProcent}%)</span><span class="row-value">${formatCurrency(metrics.egetKapital)}</span></div>
          <div class="row"><span class="row-label">Lånebelopp (${100-data.egetKapitalProcent}%)</span><span class="row-value">${formatCurrency(metrics.lanebelopp)}</span></div>
          <div class="row"><span class="row-label">Ränta</span><span class="row-value">${data.ranta}%</span></div>
          <div class="row"><span class="row-label">Räntekostnad/år</span><span class="row-value">${formatCurrency(metrics.rantekostnadAr)}</span></div>
          <div class="row"><span class="row-label">Amortering (${data.amorteringProcent}%)</span><span class="row-value">${formatCurrency(metrics.amorteringAr)}/år</span></div>
        </div>
      </div>
    </div>
    
    <div class="grid">
      <div class="section">
        <div class="section-title">📋 Engångskostnader</div>
        <div class="card">
          <div class="row"><span class="row-label">Köpare</span><span class="row-value">${data.kopareTyp === 'bolag' ? 'Bolag' : 'Privatperson'}</span></div>
          <div class="row"><span class="row-label">Stämpelskatt (${data.kopareTyp === 'bolag' ? '4,25' : '1,5'}%)</span><span class="row-value">${formatCurrency(metrics.stampelskatt)}</span></div>
          <div class="row"><span class="row-label">Pantbrevsavgift</span><span class="row-value">${formatCurrency(metrics.pantbrevsavgift)}</span></div>
          ${data.besiktningskostnad > 0 ? `<div class="row"><span class="row-label">Besiktning</span><span class="row-value">${formatCurrency(data.besiktningskostnad)}</span></div>` : ''}
          <div class="row"><span class="row-label"><strong>Summa</strong></span><span class="row-value"><strong>${formatCurrency(metrics.totalaEngangskostnader)}</strong></span></div>
        </div>
      </div>
      
      ${metrics.totalaRenoveringskostnader > 0 ? `
      <div class="section">
        <div class="section-title">🔧 Renoveringskostnader</div>
        <div class="card">
          ${renoveringar.filter(r => r.kostnad > 0).map(r => `
            <div class="row"><span class="row-label">${r.namn || 'Renovering'}</span><span class="row-value">${formatCurrency(r.kostnad)}</span></div>
          `).join('')}
          <div class="row"><span class="row-label"><strong>Summa</strong></span><span class="row-value"><strong>${formatCurrency(metrics.totalaRenoveringskostnader)}</strong></span></div>
          <div style="font-size: 9px; color: #64748b; margin-top: 5px;">${renoveringBelastarDrift ? '⚠️ Belastar driftnetto' : 'Engångskostnad'}</div>
        </div>
      </div>
      ` : ''}
    </div>
    
    <div class="section">
      <div class="section-title">🏦 Kassaflöde enligt olika beräkningsmetoder</div>
      <table class="table">
        <thead>
          <tr>
            <th></th>
            <th class="right">Säljarens info</th>
            <th class="right">50%-regeln</th>
            <th class="right">Schablon 420kr/m²</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Driftkostnader</td>
            <td class="right">${formatCurrency(data.driftkostnaderSaljare)}</td>
            <td class="right">${formatCurrency(metrics.schablon50Procent)}</td>
            <td class="right">${formatCurrency(metrics.schablonKvm)}</td>
          </tr>
          <tr>
            <td>Driftnetto (NOI)</td>
            <td class="right">${formatCurrency(metrics.driftnettoSaljare)}</td>
            <td class="right">${formatCurrency(metrics.driftnetto50Procent)}</td>
            <td class="right">${formatCurrency(metrics.driftnettoSchablon)}</td>
          </tr>
          <tr>
            <td><strong>Kassaflöde/år (efter skatt)</strong></td>
            <td class="right ${metrics.cashflowEfterSkattSaljare >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(metrics.cashflowEfterSkattSaljare)}</strong></td>
            <td class="right ${metrics.cashflowEfterSkatt50 >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(metrics.cashflowEfterSkatt50)}</strong></td>
            <td class="right ${metrics.cashflowEfterSkattSchablon >= 0 ? 'positive' : 'negative'}"><strong>${formatCurrency(metrics.cashflowEfterSkattSchablon)}</strong></td>
          </tr>
          <tr>
            <td><strong>Cash-on-Cash (CoC)</strong></td>
            <td class="right"><strong>${metrics.cocSaljare.toFixed(2)}%</strong></td>
            <td class="right"><strong>${metrics.coc50Procent.toFixed(2)}%</strong></td>
            <td class="right"><strong>${metrics.cocSchablon.toFixed(2)}%</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div class="section">
      <div class="section-title">📈 Ackumulerat kassaflöde</div>
      <table class="table">
        <thead>
          <tr>
            <th></th>
            <th class="right">År 1</th>
            <th class="right">År 2</th>
            <th class="right">År 3</th>
            <th class="right">År 4</th>
            <th class="right">År 5</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Säljarens info</td>
            ${metrics.ackumuleratCashflow.map(row => `<td class="right">${formatCurrency(row.saljare)}</td>`).join('')}
          </tr>
          <tr>
            <td>50%-regeln</td>
            ${metrics.ackumuleratCashflow.map(row => `<td class="right">${formatCurrency(row.procent50)}</td>`).join('')}
          </tr>
          <tr>
            <td>Schablon</td>
            ${metrics.ackumuleratCashflow.map(row => `<td class="right">${formatCurrency(row.schablon)}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    </div>
    
    ${(fordelar.some(f => f.trim()) || nackdelar.some(n => n.trim())) ? `
    <div class="section">
      <div class="section-title">📝 Fördelar & Nackdelar</div>
      <div class="pros-cons">
        <div class="pros">
          <div class="pros-title">✓ Fördelar</div>
          ${fordelar.filter(f => f.trim()).map(f => `<div class="list-item">${f}</div>`).join('') || '<div style="color: #94a3b8;">Inga angivna</div>'}
        </div>
        <div class="cons">
          <div class="cons-title">✗ Nackdelar</div>
          ${nackdelar.filter(n => n.trim()).map(n => `<div class="list-item">${n}</div>`).join('') || '<div style="color: #94a3b8;">Inga angivna</div>'}
        </div>
      </div>
    </div>
    ` : ''}
    
    <div class="section">
      <div class="section-title">📊 Sammanfattning</div>
      <div class="card">
        <div class="row"><span class="row-label">Total investering (eget kapital + kostnader)</span><span class="row-value">${formatCurrency(totalInvesteringBelanat)}</span></div>
        <div class="row"><span class="row-label">Årligt kassaflöde efter skatt</span><span class="row-value ${metrics.cashflowEfterSkattSaljare >= 0 ? 'positive' : 'negative'}">${formatCurrency(metrics.cashflowEfterSkattSaljare)}</span></div>
        <div class="row"><span class="row-label">Månatligt kassaflöde</span><span class="row-value ${metrics.cashflowEfterSkattSaljare >= 0 ? 'positive' : 'negative'}">${formatCurrency(metrics.cashflowEfterSkattSaljare / 12)}</span></div>
        <div class="row"><span class="row-label">Avkastning på eget kapital (CoC)</span><span class="row-value">${metrics.cocSaljare.toFixed(2)}%</span></div>
        <div class="row"><span class="row-label">Payoff-tid</span><span class="row-value">${payoffTid}</span></div>
      </div>
    </div>
    
    <div class="footer">
      Genererad med FastX • ${reportDate} • Alla beräkningar är uppskattningar
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    } else {
      setError('Kunde inte öppna PDF. Kontrollera att popup-blockerare är avstängd.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleValueChange = (field, value, isCompare = false) => {
    // Behåll strängar för vissa fält (t.ex. kopareTyp)
    const stringFields = ['kopareTyp'];
    const processedValue = stringFields.includes(field) 
      ? value 
      : (typeof value === 'number' ? value : (parseFloat(value) || 0));
    
    if (isCompare) {
      setCompareData(prev => ({ ...prev, [field]: processedValue }));
    } else {
      setData(prev => ({ ...prev, [field]: processedValue }));
    }
  };

  // Formatera valuta med mellanslag som tusenseparator
  const formatCurrency = (v) => {
    const num = Math.round(v);
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${formatted} kr`;
  };

  // Uppdatera antal lägenheter/lokaler och synka med individuella hyror
  const updateEnhetCount = (field, value) => {
    const count = parseInt(value) || 0;
    handleValueChange(field, count);
    
    if (field === 'antalLagenheter') {
      const newHyror = [];
      for (let i = 0; i < count; i++) {
        newHyror.push(lagenhetsHyror[i] || { id: i + 1, namn: `Lägenhet ${i + 1}`, hyra: 0 });
      }
      setLagenhetsHyror(newHyror);
    } else if (field === 'antalLokaler') {
      const newHyror = [];
      for (let i = 0; i < count; i++) {
        newHyror.push(lokalHyror[i] || { id: i + 1, namn: `Lokal ${i + 1}`, hyra: 0 });
      }
      setLokalHyror(newHyror);
    }
  };

  // Uppdatera individuell hyra
  const updateIndividualRent = (type, index, field, value) => {
    if (type === 'lagenhet') {
      const updated = [...lagenhetsHyror];
      updated[index] = { ...updated[index], [field]: field === 'hyra' ? (parseFloat(value) || 0) : value };
      setLagenhetsHyror(updated);
    } else {
      const updated = [...lokalHyror];
      updated[index] = { ...updated[index], [field]: field === 'hyra' ? (parseFloat(value) || 0) : value };
      setLokalHyror(updated);
    }
  };

  // Generera delningslänk
  const generateShareLink = () => {
    const shareData = {
      d: data,
      r: renoveringar.filter(r => r.kostnad > 0),
      rb: renoveringBelastarDrift,
      f: fordelar.filter(f => f.trim()),
      n: nackdelar.filter(n => n.trim()),
      lh: useIndividualRents ? lagenhetsHyror : [],
      kh: useIndividualRents ? lokalHyror : [],
      ui: useIndividualRents
    };
    
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)));
    const link = `${window.location.origin}${window.location.pathname}?calc=${encoded}`;
    setShareLink(link);
    setShowShareDialog(true);
  };

  // Kopiera länk till urklipp
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Fallback för äldre webbläsare
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Ladda delad kalkyl från URL vid start
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const calcParam = params.get('calc');
    if (calcParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(calcParam)));
        if (decoded.d) setData(decoded.d);
        if (decoded.r) setRenoveringar(decoded.r.length > 0 ? decoded.r : [{ id: 1, namn: '', kostnad: 0 }]);
        if (decoded.rb !== undefined) setRenoveringBelastarDrift(decoded.rb);
        if (decoded.f) setFordelar(decoded.f.length > 0 ? decoded.f : ['']);
        if (decoded.n) setNackdelar(decoded.n.length > 0 ? decoded.n : ['']);
        if (decoded.lh) setLagenhetsHyror(decoded.lh);
        if (decoded.kh) setLokalHyror(decoded.kh);
        if (decoded.ui !== undefined) setUseIndividualRents(decoded.ui);
        // Rensa URL:en
        window.history.replaceState({}, document.title, window.location.pathname);
        setError('✓ Delad kalkyl laddad!');
        setTimeout(() => setError(''), 3000);
      } catch (e) {
        console.log('Kunde inte ladda delad kalkyl');
      }
    }
  }, []);

  // Hantera fördelar/nackdelar
  const addFordel = () => setFordelar([...fordelar, '']);
  const addNackdel = () => setNackdelar([...nackdelar, '']);
  const updateFordel = (index, value) => {
    const updated = [...fordelar];
    updated[index] = value;
    setFordelar(updated);
  };
  const updateNackdel = (index, value) => {
    const updated = [...nackdelar];
    updated[index] = value;
    setNackdelar(updated);
  };
  const removeFordel = (index) => setFordelar(fordelar.filter((_, i) => i !== index));
  const removeNackdel = (index) => setNackdelar(nackdelar.filter((_, i) => i !== index));

  // Hantera renoveringar
  const addRenovering = () => {
    const newId = Math.max(...renoveringar.map(r => r.id), 0) + 1;
    setRenoveringar([...renoveringar, { id: newId, namn: '', kostnad: 0 }]);
  };

  const updateRenovering = (id, field, value) => {
    setRenoveringar(renoveringar.map(r => 
      r.id === id ? { ...r, [field]: field === 'kostnad' ? (parseFloat(value) || 0) : value } : r
    ));
  };

  const removeRenovering = (id) => {
    if (renoveringar.length > 1) {
      setRenoveringar(renoveringar.filter(r => r.id !== id));
    }
  };

  return (
    <div className={`min-h-screen p-2 sm:p-4 transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 transition-colors duration-300 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <img src="/icons/logo.png" alt="FastX" className="h-10 sm:h-12 w-auto rounded-lg" />
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fastighetskalkyl för investerare</p>
            </div>
            <div className="mt-3 lg:mt-0 flex flex-wrap items-center gap-2">
              {/* Auth buttons */}
              {user ? (
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                    <Cloud size={14} />
                    <span className="text-xs hidden sm:inline">{user.email?.split('@')[0]}</span>
                  </div>
                  {syncing && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      <Loader2 size={12} className="animate-spin" />
                      <span className="hidden sm:inline">Synkar...</span>
                    </div>
                  )}
                  <button
                    onClick={() => signOut()}
                    className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    title="Logga ut"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm font-medium ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  <LogIn size={14} />
                  <span>Logga in</span>
                </button>
              )}
              
              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title={darkMode ? 'Ljust läge' : 'Mörkt läge'}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${metrics.cashflowEfterSkattSaljare > 0 ? darkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700' : darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'}`}>
                {metrics.cashflowEfterSkattSaljare > 0 ? '✓ Positivt' : '✗ Negativt'}
              </span>
              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${darkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                {metrics.direktavkastning.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Mobile summary card */}
          <div className={`lg:hidden mb-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-indigo-50 to-blue-50'}`}>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Kassaflöde/mån</div>
                <div className={`text-lg font-bold ${metrics.cashflowEfterSkattSaljare >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(metrics.cashflowEfterSkattSaljare / 12)}
                </div>
              </div>
              <div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cash-on-Cash</div>
                <div className={`text-lg font-bold ${metrics.cocSaljare >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {metrics.cocSaljare.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
            <button
              onClick={() => setShowSaveDialog(true)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${darkMode ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              <Save size={14} className="sm:w-4 sm:h-4" /> Spara
            </button>
            <button
              onClick={() => setActiveTab('sparade')}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              <FolderOpen size={14} className="sm:w-4 sm:h-4" /> ({savedCalcs.length})
            </button>
            <button
              onClick={generateShareLink}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${darkMode ? 'bg-purple-900/50 text-purple-400 hover:bg-purple-900' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
            >
              <Share2 size={14} className="sm:w-4 sm:h-4" /> Dela
            </button>
            <button
              onClick={exportToPDF}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${darkMode ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
            >
              <Download size={14} className="sm:w-4 sm:h-4" /> PDF
            </button>
          </div>

          {/* Share Dialog */}
          {showShareDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
              <div className={`rounded-xl p-4 sm:p-6 w-full max-w-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-base sm:text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dela kalkyl</h3>
                <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Kopiera länken för att dela kalkylen.
                </p>
                <div className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg mb-3 sm:mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Link size={14} className={`flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className={`flex-1 min-w-0 bg-transparent text-xs sm:text-sm outline-none truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}
                  />
                  <button
                    onClick={copyShareLink}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${linkCopied ? 'bg-green-500 text-white' : darkMode ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                {linkCopied && (
                  <p className="text-green-500 text-xs sm:text-sm mb-3 sm:mb-4">✓ Länk kopierad!</p>
                )}
                <button
                  onClick={() => setShowShareDialog(false)}
                  className={`w-full px-4 py-2 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Stäng
                </button>
              </div>
            </div>
          )}

          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className={`rounded-xl p-6 w-full max-w-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Spara kalkyl</h3>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="T.ex. Hagmarksgatan 31, Hofors"
                  className={`w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveCalculation}
                    disabled={!saveName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Spara
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tabs - scrollable on mobile */}
          <div className="relative mb-4 sm:mb-6">
            <div className={`flex gap-1 p-1 rounded-xl overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {[
                { id: 'kalkyl', icon: '📊', label: 'Kalkyl', mobileLabel: 'Kalkyl' },
                { id: 'cashflow', icon: '💰', label: 'Cashflow-jämförelse', mobileLabel: 'Cashflow' },
                { id: 'payoff', icon: '⏱️', label: 'Payoff-tid', mobileLabel: 'Payoff' },
                { id: 'breakeven', icon: '🎯', label: 'Break-even', mobileLabel: 'Break-even' },
                { id: 'tidslinje', icon: '📈', label: 'Tidslinje', mobileLabel: 'Tidslinje' },
                { id: 'ranta', icon: '📉', label: 'Räntekänslighet', mobileLabel: 'Ränta' },
                { id: 'anteckningar', icon: '📝', label: 'För/Nackdelar', mobileLabel: 'Anteckn.' },
                { id: 'sparade', icon: '💾', label: 'Sparade', mobileLabel: 'Sparade' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-2 sm:px-3 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? darkMode ? 'bg-gray-600 shadow-md text-blue-400' : 'bg-white shadow-md text-blue-600' 
                      : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.icon} <span className="sm:hidden">{tab.mobileLabel}</span><span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            {/* Scroll indicator for mobile */}
            <div className={`absolute right-0 top-0 bottom-0 w-8 pointer-events-none sm:hidden rounded-r-xl ${darkMode ? 'bg-gradient-to-l from-gray-700 to-transparent' : 'bg-gradient-to-l from-gray-100 to-transparent'}`}></div>
          </div>

          {error && (
            <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${error.startsWith('✓') ? darkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700' : darkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700'}`}>
              {error}
            </div>
          )}

          {/* KALKYL TAB */}
          {activeTab === 'kalkyl' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Kolumn 1: Grunddata & Finansiering */}
              <div className="space-y-4">
                {/* Grunddata */}
                <div className={`rounded-xl p-3 sm:p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-br from-blue-50 to-blue-100/50'}`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}>
                    <Building size={18} className="sm:w-5 sm:h-5" /> Grunddata
                  </h3>
                  <InputField label="Pris på fastigheten" value={data.fastighetspris} field="fastighetspris" suffix="kr" onValueChange={handleValueChange} darkMode={darkMode} />
                  
                  {/* Hyresinmatning */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Hyresintäkter
                      </label>
                      {!useIndividualRents && (
                        <div className={`flex text-xs rounded-lg overflow-hidden ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <button
                            onClick={() => setHyresInput('manad')}
                            className={`px-2 py-1 transition-colors ${hyresInput === 'manad' ? 'bg-blue-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                          >
                            /mån
                          </button>
                          <button
                            onClick={() => setHyresInput('ar')}
                            className={`px-2 py-1 transition-colors ${hyresInput === 'ar' ? 'bg-blue-500 text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                          >
                            /år
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Toggle för individuella hyror */}
                    <div className={`mb-2 p-2 rounded-lg ${darkMode ? 'bg-gray-600/50' : 'bg-blue-50/50'}`}>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={useIndividualRents}
                            onChange={(e) => setUseIndividualRents(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${useIndividualRents ? 'bg-blue-500' : darkMode ? 'bg-gray-500' : 'bg-gray-300'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${useIndividualRents ? 'translate-x-4' : ''}`}></div>
                          </div>
                        </div>
                        <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Ange hyror per enhet
                        </span>
                      </label>
                    </div>
                    
                    {/* Vanlig hyresinmatning */}
                    {!useIndividualRents && (
                      <>
                        <div className="flex items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatNumber(hyresInput === 'ar' ? data.hyresintakterAr : Math.round(data.hyresintakterAr / 12))}
                            onChange={(e) => {
                              const val = parseFormattedNumber(e.target.value);
                              handleValueChange('hyresintakterAr', hyresInput === 'ar' ? val : val * 12);
                            }}
                            placeholder="0"
                            className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                          />
                          <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>kr{hyresInput === 'manad' ? '/mån' : '/år'}</span>
                        </div>
                        {hyresInput === 'manad' && (
                          <div className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            = {formatCurrency(data.hyresintakterAr)}/år
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Individuella hyror */}
                    {useIndividualRents && (
                      <div className={`p-2 sm:p-3 rounded-lg ${darkMode ? 'bg-gray-600/30' : 'bg-white/70'}`}>
                        {/* Lägenheter */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Lägenheter ({lagenhetsHyror.length})
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setLagenhetsHyror([...lagenhetsHyror, { id: lagenhetsHyror.length + 1, namn: `Lgh ${lagenhetsHyror.length + 1}`, hyra: 0 }])}
                                className={`w-7 h-7 flex items-center justify-center text-sm rounded ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                              >
                                +
                              </button>
                              {lagenhetsHyror.length > 0 && (
                                <button
                                  onClick={() => setLagenhetsHyror(lagenhetsHyror.slice(0, -1))}
                                  className={`w-7 h-7 flex items-center justify-center text-sm rounded ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                >
                                  −
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {lagenhetsHyror.map((lgh, index) => (
                              <div key={index} className="flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  value={lgh.namn}
                                  onChange={(e) => updateIndividualRent('lagenhet', index, 'namn', e.target.value)}
                                  className={`flex-1 min-w-0 px-2 py-1.5 border rounded text-xs ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                                  placeholder={`Lgh ${index + 1}`}
                                />
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatNumber(lgh.hyra)}
                                    onChange={(e) => updateIndividualRent('lagenhet', index, 'hyra', parseFormattedNumber(e.target.value))}
                                    className={`w-20 sm:w-24 px-2 py-1.5 border rounded text-xs text-right ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                                    placeholder="0"
                                  />
                                  <span className={`text-xs whitespace-nowrap ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>/mån</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Lokaler */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Lokaler ({lokalHyror.length})
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setLokalHyror([...lokalHyror, { id: lokalHyror.length + 1, namn: `Lokal ${lokalHyror.length + 1}`, hyra: 0 }])}
                                className={`w-7 h-7 flex items-center justify-center text-sm rounded ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                              >
                                +
                              </button>
                              {lokalHyror.length > 0 && (
                                <button
                                  onClick={() => setLokalHyror(lokalHyror.slice(0, -1))}
                                  className={`w-7 h-7 flex items-center justify-center text-sm rounded ${darkMode ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                >
                                  −
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {lokalHyror.map((lokal, index) => (
                              <div key={index} className="flex gap-1.5 items-center">
                                <input
                                  type="text"
                                  value={lokal.namn}
                                  onChange={(e) => updateIndividualRent('lokal', index, 'namn', e.target.value)}
                                  className={`flex-1 min-w-0 px-2 py-1.5 border rounded text-xs ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                                  placeholder={`Lokal ${index + 1}`}
                                />
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatNumber(lokal.hyra)}
                                    onChange={(e) => updateIndividualRent('lokal', index, 'hyra', parseFormattedNumber(e.target.value))}
                                    className={`w-20 sm:w-24 px-2 py-1.5 border rounded text-xs text-right ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                                    placeholder="0"
                                  />
                                  <span className={`text-xs whitespace-nowrap ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>/mån</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Summa */}
                        <div className={`pt-2 mt-2 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Summa:</span>
                            <div className="text-right">
                              <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(calculateTotalRent())}/år
                              </span>
                              <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                ({formatCurrency(calculateTotalRent() / 12)}/mån)
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <InputField label="Driftkostnader (från säljare)" value={data.driftkostnaderSaljare} field="driftkostnaderSaljare" suffix="kr/år" onValueChange={handleValueChange} darkMode={darkMode} />
                  
                  <InputField label="Bruksarea totalt" value={data.bruksarea} field="bruksarea" suffix="m²" onValueChange={handleValueChange} darkMode={darkMode} />
                  
                  <div className={`mt-3 pt-3 border-t space-y-1 ${darkMode ? 'border-gray-600' : 'border-blue-200'}`}>
                    <ResultRow label="Driftnetto (NOI)" value={formatCurrency(metrics.driftnettoSaljare)} highlight darkMode={darkMode} />
                    <ResultRow label="Direktavkastning" value={`${metrics.direktavkastning.toFixed(2)}%`} darkMode={darkMode} />
                  </div>
                </div>

                {/* Finansiering */}
                <div className={`rounded-xl p-3 sm:p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-br from-green-50 to-green-100/50'}`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${darkMode ? 'text-green-400' : 'text-green-900'}`}>💰 Finansiering</h3>
                  <InputField label="Eget kapital" value={data.egetKapitalProcent} field="egetKapitalProcent" suffix="%" tooltip="Andel av köpeskillingen som betalas kontant" onValueChange={handleValueChange} darkMode={darkMode} />
                  
                  {isFullyOwnedCapital && (
                    <div className={`mb-3 p-2 sm:p-3 rounded-lg text-xs sm:text-sm ${darkMode ? 'bg-green-900/30 border border-green-700 text-green-400' : 'bg-green-100 border border-green-300 text-green-800'}`}>
                      ✓ Kontantköp - ingen belåning
                    </div>
                  )}
                  
                  <InputField label="Ränta" value={data.ranta} field="ranta" suffix="%" onValueChange={handleValueChange} disabled={isFullyOwnedCapital} darkMode={darkMode} />
                  <InputField label="Amortering" value={data.amorteringProcent} field="amorteringProcent" suffix="%" tooltip="Årlig amortering i %" onValueChange={handleValueChange} disabled={isFullyOwnedCapital} darkMode={darkMode} />
                  
                  <div className={`mt-3 pt-3 border-t space-y-1 ${darkMode ? 'border-gray-600' : 'border-green-200'}`}>
                    <ResultRow label={`Eget kapital (${data.egetKapitalProcent}%)`} value={formatCurrency(metrics.egetKapital)} darkMode={darkMode} />
                    {!isFullyOwnedCapital && (
                      <>
                        <ResultRow label={`Lånebelopp (${100-data.egetKapitalProcent}%)`} value={formatCurrency(metrics.lanebelopp)} darkMode={darkMode} />
                        <ResultRow label="Räntekostnad/år" value={formatCurrency(metrics.rantekostnadAr)} darkMode={darkMode} />
                        <ResultRow label="Amortering/år" value={formatCurrency(metrics.amorteringAr)} darkMode={darkMode} />
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Kolumn 2: Engångskostnader & Renovering */}
              <div className="space-y-4">
                {/* Engångskostnader */}
                <div className={`rounded-xl p-3 sm:p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-br from-amber-50 to-amber-100/50'}`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${darkMode ? 'text-amber-400' : 'text-amber-900'}`}>📋 Engångskostnader</h3>
                  
                  <div className="mb-3">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Köpare</label>
                    <select
                      value={data.kopareTyp}
                      onChange={(e) => handleValueChange('kopareTyp', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                    >
                      <option value="bolag">Bolag (4,25%)</option>
                      <option value="privat">Privatperson (1,5%)</option>
                    </select>
                  </div>
                  
                  <InputField label="Befintliga pantbrev" value={data.befintligaPantbrev} field="befintligaPantbrev" suffix="kr" tooltip="Reducerar pantbrevsavgiften" onValueChange={handleValueChange} darkMode={darkMode} />
                  <InputField label="Besiktningskostnad" value={data.besiktningskostnad} field="besiktningskostnad" suffix="kr" onValueChange={handleValueChange} darkMode={darkMode} />
                  
                  <div className={`mt-3 pt-3 border-t space-y-1 ${darkMode ? 'border-amber-800' : 'border-amber-200'}`}>
                    <ResultRow label={`Stämpelskatt (${data.kopareTyp === 'bolag' ? '4,25' : '1,5'}%)`} value={formatCurrency(metrics.stampelskatt)} darkMode={darkMode} />
                    <ResultRow label="Pantbrevsavgift (2%)" value={formatCurrency(metrics.pantbrevsavgift)} darkMode={darkMode} />
                    <ResultRow label="Summa engångskostnader" value={formatCurrency(metrics.totalaEngangskostnader)} highlight darkMode={darkMode} />
                  </div>
                </div>

                {/* Renoveringskostnader - Dynamiska */}
                <div className={`rounded-xl p-3 sm:p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-br from-orange-50 to-orange-100/50'}`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'text-orange-400' : 'text-orange-900'}`}>
                    <Wrench size={18} className="sm:w-5 sm:h-5" /> Renovering
                  </h3>
                  
                  {/* Toggle för att belasta driftnetto */}
                  <div className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-lg border ${darkMode ? 'bg-gray-700/50 border-orange-800' : 'bg-white border-orange-200'}`}>
                    <label className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={renoveringBelastarDrift}
                          onChange={(e) => setRenoveringBelastarDrift(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 rounded-full transition-colors ${renoveringBelastarDrift ? 'bg-orange-500' : (darkMode ? 'bg-gray-600' : 'bg-gray-300')}`}>
                          <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${renoveringBelastarDrift ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </div>
                      <span className={`text-xs sm:text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {renoveringBelastarDrift ? 'Belastar drift' : 'Engångskostnad'}
                      </span>
                    </label>
                  </div>
                  
                  {/* Dynamiska rader */}
                  <div className="space-y-2">
                    {renoveringar.map((renovering) => (
                      <div key={renovering.id} className="flex gap-1 sm:gap-2 items-start">
                        <input
                          type="text"
                          value={renovering.namn}
                          onChange={(e) => updateRenovering(renovering.id, 'namn', e.target.value)}
                          placeholder="Beskrivning..."
                          className={`flex-1 min-w-0 px-2 sm:px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                        />
                        <input
                          type="number"
                          value={renovering.kostnad === 0 ? '' : renovering.kostnad}
                          onChange={(e) => updateRenovering(renovering.id, 'kostnad', e.target.value)}
                          placeholder="0"
                          className={`w-20 sm:w-28 px-2 sm:px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300'}`}
                        />
                        <span className={`hidden sm:block py-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>kr</span>
                        <button
                          onClick={() => removeRenovering(renovering.id)}
                          disabled={renoveringar.length <= 1}
                          className={`p-2 text-red-500 rounded-md disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 ${darkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-100'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={addRenovering}
                    className={`mt-3 w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium ${darkMode ? 'bg-orange-900/50 text-orange-300 hover:bg-orange-900/70' : 'bg-orange-200 text-orange-800 hover:bg-orange-300'}`}
                  >
                    <Plus size={14} className="sm:w-4 sm:h-4" /> Lägg till
                  </button>
                  
                  <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-orange-800' : 'border-orange-200'}`}>
                    <ResultRow label="Totalt renovering" value={formatCurrency(metrics.totalaRenoveringskostnader)} highlight darkMode={darkMode} />
                    {renoveringBelastarDrift && (
                      <div className={`text-xs mt-1 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>⚠️ Belastar driftnettot</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Kolumn 3: Resultat & Bankens schabloner */}
              <div className="space-y-4">
                {/* Bankens schabloner */}
                <div className={`rounded-xl p-3 sm:p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-br from-purple-50 to-purple-100/50'}`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${darkMode ? 'text-purple-400' : 'text-purple-900'}`}>🏦 Bankens schabloner</h3>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <div className={`rounded-lg p-2 sm:p-3 ${darkMode ? 'bg-gray-600/50' : 'bg-white'}`}>
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>50%-regeln</div>
                      <div className={`flex justify-between text-xs sm:text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <span>Driftkostnad:</span>
                        <span className="font-semibold">{formatCurrency(metrics.schablon50Procent)}</span>
                      </div>
                      <div className={`flex justify-between text-xs sm:text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <span>Driftnetto:</span>
                        <span className="font-semibold">{formatCurrency(metrics.driftnetto50Procent)}</span>
                      </div>
                    </div>
                    
                    <div className={`rounded-lg p-2 sm:p-3 ${darkMode ? 'bg-gray-600/50' : 'bg-white'}`}>
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>420 kr/m²</div>
                      <div className={`flex justify-between text-xs sm:text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <span>Driftkostnad:</span>
                        <span className="font-semibold">{formatCurrency(metrics.schablonKvm)}</span>
                      </div>
                      <div className={`flex justify-between text-xs sm:text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <span>Driftnetto:</span>
                        <span className="font-semibold">{formatCurrency(metrics.driftnettoSchablon)}</span>
                      </div>
                    </div>
                    
                    <div className={`rounded-lg p-2 sm:p-3 border-2 ${darkMode ? 'bg-gray-600/50 border-purple-600' : 'bg-white border-purple-300'}`}>
                      <div className={`text-xs sm:text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Säljarens info</div>
                      <div className={`flex justify-between text-xs sm:text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <span>Driftkostnad:</span>
                        <span className="font-semibold">{formatCurrency(data.driftkostnaderSaljare)}</span>
                      </div>
                      <div className={`flex justify-between text-xs sm:text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <span>Driftnetto:</span>
                        <span className="font-semibold">{formatCurrency(metrics.driftnettoSaljare)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resultat */}
                <div className={`rounded-xl p-3 sm:p-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gradient-to-br from-indigo-50 to-indigo-100/50'}`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${darkMode ? 'text-indigo-400' : 'text-indigo-900'}`}>📊 Resultat</h3>
                  
                  <div className="space-y-2 sm:space-y-3">
                    {/* Cash-on-Cash */}
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                      <div className={`rounded-lg p-1.5 sm:p-2 ${darkMode ? 'bg-gray-600/50' : 'bg-white'}`}>
                        <div className={`text-base sm:text-lg font-bold ${metrics.cocSaljare >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.cocSaljare.toFixed(1)}%
                        </div>
                        <div className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CoC Säljare</div>
                      </div>
                      <div className={`rounded-lg p-1.5 sm:p-2 ${darkMode ? 'bg-gray-600/50' : 'bg-white'}`}>
                        <div className={`text-base sm:text-lg font-bold ${metrics.coc50Procent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.coc50Procent.toFixed(1)}%
                        </div>
                        <div className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CoC 50%</div>
                      </div>
                      <div className={`rounded-lg p-1.5 sm:p-2 ${darkMode ? 'bg-gray-600/50' : 'bg-white'}`}>
                        <div className={`text-base sm:text-lg font-bold ${metrics.cocSchablon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.cocSchablon.toFixed(1)}%
                        </div>
                        <div className={`text-[10px] sm:text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CoC Schablon</div>
                      </div>
                    </div>
                    
                    {/* Kassaflöde per år */}
                    <div className={`rounded-lg p-2 sm:p-3 ${darkMode ? 'bg-gray-600/50' : 'bg-white'}`}>
                      <div className={`text-xs sm:text-sm font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Kassaflöde/år (efter skatt)</div>
                      <div className="space-y-1">
                        <div className={`flex justify-between text-xs sm:text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                          <span>Säljarens info:</span>
                          <span className={`font-bold ${metrics.cashflowEfterSkattSaljare >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(metrics.cashflowEfterSkattSaljare)}
                          </span>
                        </div>
                        <div className={`flex justify-between text-xs sm:text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                          <span>50%-regeln:</span>
                          <span className={`font-bold ${metrics.cashflowEfterSkatt50 >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(metrics.cashflowEfterSkatt50)}
                          </span>
                        </div>
                        <div className={`flex justify-between text-xs sm:text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                          <span>Schablon:</span>
                          <span className={`font-bold ${metrics.cashflowEfterSkattSchablon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(metrics.cashflowEfterSkattSchablon)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CASHFLOW TAB */}
          {activeTab === 'cashflow' && (
            <div className="space-y-4 sm:space-y-6">
              <div className={`rounded-xl border p-3 sm:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>💰 Cashflow-jämförelse</h3>
                <p className={`mb-4 sm:mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Jämför kassaflödet baserat på olika sätt att beräkna driftkostnader.</p>
                
                {/* Mobile cards view */}
                <div className="sm:hidden space-y-3">
                  {[
                    { name: 'Säljarens info', color: 'purple', driftkostnad: data.driftkostnaderSaljare, driftnetto: metrics.driftnettoSaljare, cashflow: metrics.cashflowEfterSkattSaljare, coc: metrics.cocSaljare },
                    { name: '50%-regeln', color: 'blue', driftkostnad: metrics.schablon50Procent, driftnetto: metrics.driftnetto50Procent, cashflow: metrics.cashflowEfterSkatt50, coc: metrics.coc50Procent },
                    { name: '420 kr/m²', color: 'green', driftkostnad: metrics.schablonKvm, driftnetto: metrics.driftnettoSchablon, cashflow: metrics.cashflowEfterSkattSchablon, coc: metrics.cocSchablon }
                  ].map((method) => (
                    <div key={method.name} className={`rounded-lg p-3 border ${darkMode ? 'bg-gray-700/50 border-gray-600' : `bg-${method.color}-50 border-${method.color}-200`}`}>
                      <div className={`font-semibold text-sm mb-2 ${darkMode ? 'text-white' : ''}`}>{method.name}</div>
                      <div className={`grid grid-cols-2 gap-2 text-xs ${darkMode ? 'text-gray-300' : ''}`}>
                        <div>Driftkostnad:</div>
                        <div className="text-right font-medium">{formatCurrency(method.driftkostnad)}</div>
                        <div>Driftnetto:</div>
                        <div className="text-right font-medium">{formatCurrency(method.driftnetto)}</div>
                        <div className="font-semibold">Kassaflöde/år:</div>
                        <div className={`text-right font-bold ${method.cashflow >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(method.cashflow)}
                        </div>
                        <div className="font-semibold">CoC:</div>
                        <div className={`text-right font-bold ${method.coc >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {method.coc.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop table view */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className={`w-full text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                    <thead>
                      <tr className={`border-b-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <th className="text-left py-3 px-2"></th>
                        <th className={`text-right py-3 px-2 ${darkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>Säljarens info</th>
                        <th className={`text-right py-3 px-2 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>50%-regeln</th>
                        <th className={`text-right py-3 px-2 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>Schablon 420kr/m²</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className={`py-2 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hyresintäkter</td>
                        <td className={`text-right py-2 px-2 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50/50'}`}>{formatCurrency(data.hyresintakterAr)}</td>
                        <td className={`text-right py-2 px-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50/50'}`}>{formatCurrency(data.hyresintakterAr)}</td>
                        <td className={`text-right py-2 px-2 ${darkMode ? 'bg-green-900/20' : 'bg-green-50/50'}`}>{formatCurrency(data.hyresintakterAr)}</td>
                      </tr>
                      <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <td className={`py-2 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Driftkostnader</td>
                        <td className={`text-right py-2 px-2 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50/50'}`}>{formatCurrency(data.driftkostnaderSaljare)}</td>
                        <td className={`text-right py-2 px-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50/50'}`}>{formatCurrency(metrics.schablon50Procent)}</td>
                        <td className={`text-right py-2 px-2 ${darkMode ? 'bg-green-900/20' : 'bg-green-50/50'}`}>{formatCurrency(metrics.schablonKvm)}</td>
                      </tr>
                      <tr className={`border-b font-semibold ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <td className="py-2 px-2">Driftnetto (NOI)</td>
                        <td className={`text-right py-2 px-2 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50/50'}`}>{formatCurrency(metrics.driftnettoSaljare)}</td>
                        <td className={`text-right py-2 px-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50/50'}`}>{formatCurrency(metrics.driftnetto50Procent)}</td>
                        <td className={`text-right py-2 px-2 ${darkMode ? 'bg-green-900/20' : 'bg-green-50/50'}`}>{formatCurrency(metrics.driftnettoSchablon)}</td>
                      </tr>
                      {!isFullyOwnedCapital && (
                        <>
                          <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <td className={`py-2 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Räntekostnad</td>
                            <td className={`text-right py-2 px-2 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50/50'}`}>{formatCurrency(metrics.rantekostnadAr)}</td>
                            <td className={`text-right py-2 px-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50/50'}`}>{formatCurrency(metrics.rantekostnadAr)}</td>
                            <td className={`text-right py-2 px-2 ${darkMode ? 'bg-green-900/20' : 'bg-green-50/50'}`}>{formatCurrency(metrics.rantekostnadAr)}</td>
                          </tr>
                          <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <td className={`py-2 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Amortering</td>
                            <td className={`text-right py-2 px-2 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50/50'}`}>{formatCurrency(metrics.amorteringAr)}</td>
                            <td className={`text-right py-2 px-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50/50'}`}>{formatCurrency(metrics.amorteringAr)}</td>
                            <td className={`text-right py-2 px-2 ${darkMode ? 'bg-green-900/20' : 'bg-green-50/50'}`}>{formatCurrency(metrics.amorteringAr)}</td>
                          </tr>
                          <tr className={`border-b font-semibold ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <td className="py-2 px-2">Betalnetto (före skatt)</td>
                            <td className={`text-right py-2 px-2 ${darkMode ? 'bg-purple-900/20' : 'bg-purple-50/50'} ${metrics.betalnettoSaljare >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(metrics.betalnettoSaljare)}
                            </td>
                            <td className={`text-right py-2 px-2 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50/50'} ${metrics.betalnetto50Procent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(metrics.betalnetto50Procent)}
                            </td>
                            <td className={`text-right py-2 px-2 ${darkMode ? 'bg-green-900/20' : 'bg-green-50/50'} ${metrics.betalnettoSchablon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(metrics.betalnettoSchablon)}
                            </td>
                          </tr>
                        </>
                      )}
                      <tr className={`border-b font-bold ${darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-200 bg-gray-50'}`}>
                        <td className="py-3 px-2">Kassaflöde (efter {data.bolagsskattProcent}% skatt)</td>
                        <td className={`text-right py-3 px-2 ${metrics.cashflowEfterSkattSaljare >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(metrics.cashflowEfterSkattSaljare)}
                        </td>
                        <td className={`text-right py-3 px-2 ${metrics.cashflowEfterSkatt50 >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(metrics.cashflowEfterSkatt50)}
                        </td>
                        <td className={`text-right py-3 px-2 ${metrics.cashflowEfterSkattSchablon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {formatCurrency(metrics.cashflowEfterSkattSchablon)}
                        </td>
                      </tr>
                      <tr className="font-bold text-lg">
                        <td className="py-3 px-2">{isFullyOwnedCapital ? 'Avkastning på kapital' : 'Cash-on-Cash (CoC)'}</td>
                        <td className={`text-right py-3 px-2 ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'} ${metrics.cocSaljare >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.cocSaljare.toFixed(2)}%
                        </td>
                        <td className={`text-right py-3 px-2 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-100'} ${metrics.coc50Procent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.coc50Procent.toFixed(2)}%
                        </td>
                        <td className={`text-right py-3 px-2 ${darkMode ? 'bg-green-900/30' : 'bg-green-100'} ${metrics.cocSchablon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {metrics.cocSchablon.toFixed(2)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Ackumulerat kassaflöde över 5 år */}
                <div className="mt-8">
                  <h4 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📈 Ackumulerat kassaflöde (År 1-5)</h4>
                  <div className="overflow-x-auto">
                    <table className={`w-full text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                      <thead>
                        <tr className={`border-b-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                          <th className="text-left py-3 px-2"></th>
                          <th className="text-right py-3 px-2">År 1</th>
                          <th className="text-right py-3 px-2">År 2</th>
                          <th className="text-right py-3 px-2">År 3</th>
                          <th className="text-right py-3 px-2">År 4</th>
                          <th className="text-right py-3 px-2">År 5</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <td className="py-2 px-2 font-medium">Säljarens info</td>
                          {metrics.ackumuleratCashflow.map((row, i) => (
                            <td key={i} className={`text-right py-2 px-2 ${row.saljare >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(row.saljare)}
                            </td>
                          ))}
                        </tr>
                        <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <td className="py-2 px-2 font-medium">50%-regeln</td>
                          {metrics.ackumuleratCashflow.map((row, i) => (
                            <td key={i} className={`text-right py-2 px-2 ${row.procent50 >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(row.procent50)}
                            </td>
                          ))}
                        </tr>
                        <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                          <td className="py-2 px-2 font-medium">Schablon</td>
                          {metrics.ackumuleratCashflow.map((row, i) => (
                            <td key={i} className={`text-right py-2 px-2 ${row.schablon >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatCurrency(row.schablon)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Visuell jämförelse */}
                <div className="mt-8">
                  <h4 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Visuell jämförelse</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'Säljarens info', cashflow: metrics.cashflowEfterSkattSaljare, coc: metrics.cocSaljare },
                      { name: '50%-regeln', cashflow: metrics.cashflowEfterSkatt50, coc: metrics.coc50Procent },
                      { name: 'Schablon 420kr/m²', cashflow: metrics.cashflowEfterSkattSchablon, coc: metrics.cocSchablon }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="name" fontSize={12} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <YAxis fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                      <Tooltip formatter={(value, name) => name === 'cashflow' ? formatCurrency(value) : `${value.toFixed(2)}%`} contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', borderColor: darkMode ? '#374151' : '#e5e7eb', color: darkMode ? '#fff' : '#000' }} />
                      <Bar dataKey="cashflow" fill="#8b5cf6" name="Kassaflöde/år" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* PAYOFF TAB */}
          {activeTab === 'payoff' && (
            <div className="space-y-4 sm:space-y-6">
              <div className={`rounded-xl border p-3 sm:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>⏱️ Payoff-tid</h3>
                <p className={`mb-4 sm:mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Hur lång tid tar det innan investeringen har betalat tillbaka sig?
                </p>
                
                {(() => {
                  // Beräkna payoff-tider
                  const totalInvesteringKontant = data.fastighetspris + metrics.totalaEngangskostnader;
                  const kontantKassaflode = metrics.driftnettoSaljare * (1 - data.bolagsskattProcent / 100);
                  const payoffKontant = kontantKassaflode > 0 ? totalInvesteringKontant / kontantKassaflode : Infinity;
                  
                  const totalInvesteringBelanat = metrics.egetKapital + metrics.totalaEngangskostnader;
                  const payoffBelanat = metrics.cashflowEfterSkattSaljare > 0 ? totalInvesteringBelanat / metrics.cashflowEfterSkattSaljare : Infinity;
                  
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:gap-6">
                        {/* Kontantköp */}
                        <div className={`rounded-xl p-3 sm:p-6 ${darkMode ? 'bg-blue-900/30' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}>
                          <div className="text-center">
                            <div className={`text-xs sm:text-sm mb-1 sm:mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Kontantköp</div>
                            <div className={`text-3xl sm:text-5xl font-bold mb-1 sm:mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                              {payoffKontant === Infinity ? '∞' : payoffKontant.toFixed(1)}
                            </div>
                            <div className={`text-sm sm:text-lg mb-2 sm:mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>år</div>
                            
                            <div className={`text-left space-y-1 sm:space-y-2 pt-2 sm:pt-4 border-t ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className={darkMode ? 'text-blue-400' : 'text-blue-700'}>Investering:</span>
                                <span className={`font-semibold ${darkMode ? 'text-white' : ''}`}>{formatCurrency(totalInvesteringKontant)}</span>
                              </div>
                              <div className="flex justify-between text-xs sm:text-sm">
                                <span className={darkMode ? 'text-blue-400' : 'text-blue-700'}>Kassaflöde/år:</span>
                                <span className={`font-semibold ${darkMode ? 'text-white' : ''}`}>{formatCurrency(kontantKassaflode)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Med belåning */}
                        <div className={`rounded-xl p-3 sm:p-6 ${isFullyOwnedCapital ? (darkMode ? 'bg-gray-700/30 opacity-50' : 'bg-gradient-to-br from-gray-50 to-gray-100 opacity-50') : (darkMode ? 'bg-green-900/30' : 'bg-gradient-to-br from-green-50 to-green-100')}`}>
                          <div className="text-center">
                            <div className={`text-xs sm:text-sm mb-1 sm:mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Med lån ({100 - data.egetKapitalProcent}%)</div>
                            <div className={`text-3xl sm:text-5xl font-bold mb-1 sm:mb-2 ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                              {isFullyOwnedCapital ? 'N/A' : (payoffBelanat === Infinity ? '∞' : payoffBelanat.toFixed(1))}
                            </div>
                            <div className={`text-sm sm:text-lg mb-2 sm:mb-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{isFullyOwnedCapital ? '' : 'år'}</div>
                            
                            {!isFullyOwnedCapital && (
                              <div className={`text-left space-y-1 sm:space-y-2 pt-2 sm:pt-4 border-t ${darkMode ? 'border-green-800' : 'border-green-200'}`}>
                                <div className="flex justify-between text-xs sm:text-sm">
                                  <span className={darkMode ? 'text-green-400' : 'text-green-700'}>Eget kapital:</span>
                                  <span className={`font-semibold ${darkMode ? 'text-white' : ''}`}>{formatCurrency(totalInvesteringBelanat)}</span>
                                </div>
                                <div className="flex justify-between text-xs sm:text-sm">
                                  <span className={darkMode ? 'text-green-400' : 'text-green-700'}>Kassaflöde/år:</span>
                                  <span className={`font-semibold ${darkMode ? 'text-white' : ''}`}>{formatCurrency(metrics.cashflowEfterSkattSaljare)}</span>
                                </div>
                              </div>
                            )}
                            
                            {isFullyOwnedCapital && (
                              <div className={`pt-4 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                Ej relevant vid 100% eget kapital
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Förklaring */}
                      <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Så tolkar du payoff-tiden:</h4>
                        <ul className={`text-sm space-y-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          <li>• <strong>Under 10 år:</strong> Mycket bra investering med snabb återbetalning</li>
                          <li>• <strong>10-15 år:</strong> Normal för hyresfastigheter</li>
                          <li>• <strong>15-20 år:</strong> Längre återbetalningstid, men kan fortfarande vara lönsamt</li>
                          <li>• <strong>Över 20 år:</strong> Lång återbetalningstid - värdera andra faktorer</li>
                        </ul>
                        <p className={`mt-3 text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          <strong>Notera:</strong> Payoff-tid tar inte hänsyn till värdeökning på fastigheten eller inflation. 
                          Den mäter endast hur snabbt kassaflödet återbetalar din insats.
                        </p>
                      </div>
                      
                      {/* Jämförelse */}
                      {!isFullyOwnedCapital && (
                        <div className={`mt-6 rounded-xl p-4 ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                          <h4 className={`font-semibold mb-3 ${darkMode ? 'text-indigo-400' : 'text-indigo-800'}`}>Jämförelse kontant vs belånat</h4>
                          <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                            Med belåning är din payoff-tid <strong>{payoffBelanat < payoffKontant ? 'kortare' : 'längre'}</strong> ({payoffBelanat === Infinity ? '∞' : payoffBelanat.toFixed(1)} år) 
                            jämfört med kontantköp ({payoffKontant === Infinity ? '∞' : payoffKontant.toFixed(1)} år). 
                            {payoffBelanat < payoffKontant 
                              ? ' Det beror på att du får avkastning på en större investering med mindre eget kapital (hävstång).'
                              : ' Räntekostnaderna minskar kassaflödet, vilket förlänger återbetalningstiden.'}
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* BREAK-EVEN TAB */}
          {activeTab === 'breakeven' && (
            <div className="space-y-4 sm:space-y-6">
              <div className={`rounded-xl border p-4 sm:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>🎯 Break-even analys</h3>
                <p className={`mb-4 sm:mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Visar gränsvärdena för när investeringen går från lönsam till olönsam.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className={`rounded-xl p-4 sm:p-6 ${darkMode ? 'bg-green-900/30' : 'bg-gradient-to-br from-green-50 to-green-100'}`}>
                    <div className={`text-sm mb-2 ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Minsta hyra för break-even</div>
                    <div className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{formatCurrency(breakEven.minHyraMånad)}</div>
                    <div className={`text-sm mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>/månad</div>
                    <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-green-800' : 'border-green-200'}`}>
                      <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <span>Nuvarande:</span>
                        <span className="font-semibold">{formatCurrency(data.hyresintakterAr / 12)}/mån</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className={darkMode ? 'text-gray-400' : ''}>Marginal:</span>
                        <span className={`font-semibold ${(data.hyresintakterAr / 12) > breakEven.minHyraMånad ? 'text-green-500' : 'text-red-500'}`}>
                          {(((data.hyresintakterAr / 12) / breakEven.minHyraMånad - 1) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!isFullyOwnedCapital ? (
                    <div className={`rounded-xl p-4 sm:p-6 ${darkMode ? 'bg-blue-900/30' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}>
                      <div className={`text-sm mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Max ränta för break-even</div>
                      <div className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>{breakEven.maxRanta.toFixed(1)}%</div>
                      <div className={`text-sm mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>innan negativt kassaflöde</div>
                      <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-blue-800' : 'border-blue-200'}`}>
                        <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                          <span>Nuvarande:</span>
                          <span className="font-semibold">{data.ranta}%</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className={darkMode ? 'text-gray-400' : ''}>Marginal:</span>
                          <span className={`font-semibold ${breakEven.maxRanta > data.ranta ? 'text-green-500' : 'text-red-500'}`}>
                            +{(breakEven.maxRanta - data.ranta).toFixed(1)} procentenheter
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={`rounded-xl p-4 sm:p-6 opacity-50 ${darkMode ? 'bg-blue-900/30' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}>
                      <div className={`text-sm mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Max ränta för break-even</div>
                      <div className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>N/A</div>
                      <div className={`text-sm mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Ej relevant vid kontantköp</div>
                    </div>
                  )}
                  
                  <div className={`rounded-xl p-4 sm:p-6 ${darkMode ? 'bg-orange-900/30' : 'bg-gradient-to-br from-orange-50 to-orange-100'}`}>
                    <div className={`text-sm mb-2 ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>Max vakans för break-even</div>
                    <div className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>{breakEven.maxVakans.toFixed(0)}%</div>
                    <div className={`text-sm mt-1 ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>innan negativt kassaflöde</div>
                    <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-orange-800' : 'border-orange-200'}`}>
                      <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                        <span>Nuvarande:</span>
                        <span className="font-semibold">{data.vakansgrad}%</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className={darkMode ? 'text-gray-400' : ''}>Marginal:</span>
                        <span className={`font-semibold ${breakEven.maxVakans > data.vakansgrad ? 'text-green-500' : 'text-red-500'}`}>
                          +{(breakEven.maxVakans - data.vakansgrad).toFixed(0)} procentenheter
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TIDSLINJE TAB */}
          {activeTab === 'tidslinje' && (
            <div className="space-y-4 sm:space-y-6">
              <div className={`rounded-xl border p-4 sm:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📈 Värdeutveckling över 20 år</h3>
                {isFullyOwnedCapital && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${darkMode ? 'bg-green-900/30 border border-green-800 text-green-400' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                    ✓ Kontantköp - grafen visar fastighetsvärde och ackumulerat kassaflöde utan lån
                  </div>
                )}
                <div className="mb-4">
                  <InputField 
                    label="Årlig värdeökning" 
                    value={data.vardeokning} 
                    field="vardeokning" 
                    suffix="%" 
                    tooltip="Förväntad årlig prisökning på fastigheten"
                    onValueChange={handleValueChange}
                    darkMode={darkMode}
                  />
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="year" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#000' }} />
                    <Legend />
                    <Line type="monotone" dataKey="fastighetsvarde" stroke="#8b5cf6" strokeWidth={2} name="Fastighetsvärde" dot={false} />
                    {!isFullyOwnedCapital && (
                      <Line type="monotone" dataKey="kvarstaeandeLan" stroke="#f97316" strokeWidth={2} name="Kvarvarande lån" dot={false} />
                    )}
                    <Line type="monotone" dataKey="egetKapital" stroke="#10b981" strokeWidth={2} name="Eget kapital i fastighet" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[5, 10, 20].map(year => (
                  <div key={year} className={`rounded-xl p-4 sm:p-5 ${
                    darkMode 
                      ? (year === 5 ? 'bg-blue-900/30' : year === 10 ? 'bg-green-900/30' : 'bg-purple-900/30')
                      : (year === 5 ? 'bg-gradient-to-br from-blue-50 to-blue-100' : year === 10 ? 'bg-gradient-to-br from-green-50 to-green-100' : 'bg-gradient-to-br from-purple-50 to-purple-100')
                  }`}>
                    <h4 className={`font-bold text-lg mb-3 ${darkMode ? 'text-white' : ''}`}>Efter {year} år</h4>
                    <div className={`space-y-2 text-sm ${darkMode ? 'text-gray-300' : ''}`}>
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Fastighetsvärde:</span>
                        <span className="font-semibold">{formatCurrency(timelineData[year].fastighetsvarde)}</span>
                      </div>
                      {!isFullyOwnedCapital && (
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Kvarvarande lån:</span>
                          <span className="font-semibold">{formatCurrency(timelineData[year].kvarstaeandeLan)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Ack. kassaflöde:</span>
                        <span className="font-semibold">{formatCurrency(timelineData[year].kassaflode)}</span>
                      </div>
                      <div className={`flex justify-between pt-2 border-t ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                        <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Totalt kapital:</span>
                        <span className={`font-bold text-lg ${darkMode ? 'text-white' : ''}`}>{formatCurrency(timelineData[year].totaltKapital)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RÄNTEKÄNSLIGHET TAB */}
          {activeTab === 'ranta' && (
            <div className="space-y-6">
              {isFullyOwnedCapital ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">✓</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Kontantköp - ingen räntekänslighet</h3>
                    <p className="text-gray-600">
                      Du har valt 100% eget kapital, vilket innebär att du inte har några lån och därmed ingen ränterisk.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`rounded-xl border p-4 sm:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>📉 Räntekänslighet</h3>
                  <p className={`mb-4 sm:mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Se hur kassaflödet påverkas av ränteförändringar.</p>
                  
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={rantaSliderData}>
                      <defs>
                        <linearGradient id="colorKassaflode" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis dataKey="ranta" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickFormatter={(v) => `${v}%`} />
                      <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value * 12) + '/år'} 
                        labelFormatter={(v) => `Ränta: ${v}%`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid', borderColor: darkMode ? '#374151' : '#e5e7eb', backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#000' }} 
                      />
                      <Area type="monotone" dataKey="kassaflode" stroke="#10b981" fill="url(#colorKassaflode)" strokeWidth={2} name="Kassaflöde/mån" />
                    </AreaChart>
                  </ResponsiveContainer>

                  <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4 text-center">
                    <div className={`rounded-lg p-2 sm:p-3 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                      <div className={`text-xs sm:text-sm ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Vid 2% ränta</div>
                      <div className={`font-bold text-sm sm:text-base ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                        {formatCurrency((metrics.driftnettoSaljare - metrics.lanebelopp * 0.02 - metrics.amorteringAr) / 12)}/mån
                      </div>
                    </div>
                    <div className={`rounded-lg p-2 sm:p-3 ${darkMode ? 'bg-yellow-900/30' : 'bg-yellow-50'}`}>
                      <div className={`text-xs sm:text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>Vid 5% ränta</div>
                      <div className={`font-bold text-sm sm:text-base ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                        {formatCurrency((metrics.driftnettoSaljare - metrics.lanebelopp * 0.05 - metrics.amorteringAr) / 12)}/mån
                      </div>
                    </div>
                    <div className={`rounded-lg p-2 sm:p-3 ${darkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                      <div className={`text-xs sm:text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>Vid 8% ränta</div>
                      <div className={`font-bold text-sm sm:text-base ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                        {formatCurrency((metrics.driftnettoSaljare - metrics.lanebelopp * 0.08 - metrics.amorteringAr) / 12)}/mån
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FÖRDELAR/NACKDELAR TAB */}
          {activeTab === 'anteckningar' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Fördelar */}
                <div className={`rounded-xl p-4 sm:p-6 ${darkMode ? 'bg-green-900/20' : 'bg-gradient-to-br from-green-50 to-green-100/50'}`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'text-green-400' : 'text-green-900'}`}>
                    <ThumbsUp size={18} className="sm:w-5 sm:h-5" /> Fördelar
                  </h3>
                  <div className="space-y-2">
                    {fordelar.map((fordel, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={fordel}
                          onChange={(e) => updateFordel(index, e.target.value)}
                          placeholder="Lägg till en fördel..."
                          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-green-300'}`}
                        />
                        <button
                          onClick={() => removeFordel(index)}
                          className={`px-3 py-2 rounded-md transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addFordel}
                      className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium ${darkMode ? 'bg-green-900/50 text-green-400 hover:bg-green-900' : 'bg-green-200 text-green-800 hover:bg-green-300'}`}
                    >
                      + Lägg till fördel
                    </button>
                  </div>
                </div>

                {/* Nackdelar */}
                <div className={`rounded-xl p-4 sm:p-6 ${darkMode ? 'bg-red-900/20' : 'bg-gradient-to-br from-red-50 to-red-100/50'}`}>
                  <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center gap-2 ${darkMode ? 'text-red-400' : 'text-red-900'}`}>
                    <ThumbsDown size={18} className="sm:w-5 sm:h-5" /> Nackdelar
                  </h3>
                  <div className="space-y-2">
                    {nackdelar.map((nackdel, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={nackdel}
                          onChange={(e) => updateNackdel(index, e.target.value)}
                          placeholder="Lägg till en nackdel..."
                          className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-red-300'}`}
                        />
                        <button
                          onClick={() => removeNackdel(index)}
                          className={`px-3 py-2 rounded-md transition-colors ${darkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600 hover:bg-red-100'}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addNackdel}
                      className={`w-full px-4 py-2 rounded-lg transition-colors text-sm font-medium ${darkMode ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-red-200 text-red-800 hover:bg-red-300'}`}
                    >
                      + Lägg till nackdel
                    </button>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl border p-4 sm:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h4 className={`font-bold mb-3 sm:mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>💡 Tips på saker att överväga</h4>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div>
                    <strong className={darkMode ? 'text-green-400' : 'text-green-700'}>Potentiella fördelar:</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Bra läge / närhet till service</li>
                      <li>Stabil hyresgästbas</li>
                      <li>Uppgraderingspotential</li>
                      <li>Låg vakansrisk</li>
                      <li>Möjlighet till hyreshöjning</li>
                    </ul>
                  </div>
                  <div>
                    <strong className={darkMode ? 'text-red-400' : 'text-red-700'}>Potentiella nackdelar:</strong>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Renoveringsbehov</li>
                      <li>Avfolkningsort</li>
                      <li>Eftersatt underhåll</li>
                      <li>Problematiska hyresgäster</li>
                      <li>Dålig energiklass</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SPARADE TAB */}
          {activeTab === 'sparade' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Demo-kalkyl */}
              <div className={`rounded-xl border p-4 sm:p-6 ${darkMode ? 'bg-amber-900/20 border-amber-700' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'}`}>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-amber-400' : 'text-amber-800'}`}>🎓 Demo-kalkyl</h3>
                <p className={`mb-4 text-sm ${darkMode ? 'text-amber-300/70' : 'text-amber-700'}`}>
                  Ladda in en exempelkalkyl för att se hur FastX fungerar med riktiga siffror.
                </p>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-amber-700/50' : 'bg-white border-amber-200'}`}>
                  <div>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Exempelfastighet: Hofors</div>
                    <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatCurrency(demoKalkyl.data.fastighetspris)} • {demoKalkyl.data.antalLagenheter} lgh • {demoKalkyl.data.bruksarea} m²
                    </div>
                    <div className={`text-xs mt-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Inkluderar renoveringar, fördelar & nackdelar</div>
                  </div>
                  <button
                    onClick={() => loadCalculation(demoKalkyl)}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Ladda demo
                  </button>
                </div>
              </div>

              {/* Sparade kalkyler */}
              <div className={`rounded-xl border p-4 sm:p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>💾 Dina sparade kalkyler</h3>
                <p className={`mb-4 sm:mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Kalkyler du sparat lagras lokalt i din webbläsare.
                </p>
                
                {savedCalcs.length === 0 ? (
                  <div className={`text-center py-8 sm:py-12 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    <FolderOpen size={40} className="mx-auto mb-3 sm:mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">Inga sparade kalkyler ännu.</p>
                    <p className="text-xs sm:text-sm mt-2">Klicka på "Spara" för att spara din nuvarande kalkyl.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedCalcs.map(calc => {
                      const calcMetrics = calculateMetrics(calc.data, calc.renoveringar || []);
                      return (
                        <div key={calc.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg transition-colors ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                          <div className="min-w-0">
                            <div className={`font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{calc.name}</div>
                            <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatCurrency(calc.data.fastighetspris)} • CoC: {calcMetrics.cocSaljare.toFixed(1)}%
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              Sparad: {new Date(calc.timestamp).toLocaleDateString('sv-SE')}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => loadCalculation(calc)}
                              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium ${darkMode ? 'bg-blue-900/50 text-blue-400 hover:bg-blue-900' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                            >
                              Ladda
                            </button>
                            <button
                              onClick={() => deleteCalculation(calc.id)}
                              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm font-medium ${darkMode ? 'bg-red-900/50 text-red-400 hover:bg-red-900' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                            >
                              Ta bort
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`text-center text-xs sm:text-sm py-4 flex items-center justify-center gap-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          <img src="/icons/logo.png" alt="FastX" className="h-6 w-auto rounded" />
          <span>• Fastighetskalkyl för investerare</span>
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        darkMode={darkMode}
      />
    </div>
  );
};

// Wrapper-komponent med AuthProvider
const FastighetsKalkyl = () => {
  return (
    <AuthProvider>
      <FastighetsKalkylInner />
    </AuthProvider>
  );
};

export default FastighetsKalkyl;
