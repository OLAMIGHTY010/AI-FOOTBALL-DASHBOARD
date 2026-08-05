from database import supabase
print("Supabase connected:", supabase is not None)
if supabase:
    print(supabase.table('wallets').select('*').limit(1).execute())
