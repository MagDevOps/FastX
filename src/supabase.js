import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qowgfjefailmndwtrnvi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvd2dmamVmYWlsbW5kd3RybnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NzMzODAsImV4cCI6MjA4MzU0OTM4MH0.xcQnViFkszellyYYf65ZH6v__9JYmwHTrEqbm5o_ps0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
