import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listExercises() {
    const { data, error } = await supabase
        .from('exercises')
        .select('name, category')
        .order('name');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("# Available Exercises");
    console.log(`Total: ${data.length}`);
    console.log("-------------------");
    data.forEach(ex => {
        console.log(`- [${ex.category}] ${ex.name}`);
    });
}

listExercises();
