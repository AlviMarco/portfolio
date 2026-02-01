
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ldpytkuchpyzywgnnnxw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkcHl0a3VjaHB5enl3Z25ubnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyMjcxODIsImV4cCI6MjA4NDgwMzE4Mn0.DKBi0QOZsLnk5Juv7AsACCtrycV9idniaKyBk3UFs9w'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
