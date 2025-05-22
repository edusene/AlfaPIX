// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://weqtpacadwcmeqweavwo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcXRwYWNhZHdjbWVxd2VhdndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1OTA1NTEsImV4cCI6MjA2MzE2NjU1MX0.pM_-AeFn0WB82UuKPpzgin9rBpQ9NbqD2Wxm_1mZcbU';

export const supabase = createClient(supabaseUrl, supabaseKey);
