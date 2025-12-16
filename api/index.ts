import express, { Request, Response } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { generateProfiles } from '../utils/mockProfiles';

dotenv.config();

const app = express();

// Fallback to hardcoded values for LOCAL DEV ONLY if env is missing
// The user explicitly requested NO .env file, but we need these to run the server.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xyz.supabase.co'; // REPLACE WITH REAL URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJ...'; // REPLACE WITH REAL KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const allowedOrigins = [process.env.ALLOWED_ORIGIN || '*'];

if (process.env.LOCALHOST === 'true') {
    allowedOrigins.push('http://localhost:3000');
    allowedOrigins.push('http://localhost:5173');
}

app.use(cors({ 
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
             // For safety in production, we might want to be strict. 
             // But if allowed is *, it's open.
             callback(new Error('Not allowed by CORS'));
        }
    }
}));
app.use(express.json());

// --- Routes ---

app.get('/', (req, res) => {
  res.json({ message: 'MatchFind Backend API' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed Data
app.post('/api/seed', async (req, res) => {
    try {
        const profiles = generateProfiles();
        console.log(`Seeding ${profiles.length} profiles...`);
        
        let successCount = 0;
        let errors = [];

        for (const profile of profiles) {
            // Note: In real scenarios, you'd create auth users first. 
            // Here we assume simple profile insertion for demo if users exist, 
            // or we might fail if foreign key constraints exist and users aren't real.
            // However, with our schema, 'id' references auth.users.
            // LIMITATION: We cannot insert into 'profiles' unless the User ID exists in 'auth.users'.
            // Since we can't create auth users via API easily without Admin API (which we have via service role),
            // We will attempt to use Service Role to create a dummy user logic or just SKIP seeding if not possible
            // For now, we'll try to insert. If it fails due to FK, we'll report it.
            
           // Actually, we can't create auth users easily here without the admin api `supabase.auth.admin.createUser`.
           // Let's try that.
           
           const { data: user, error: userError } = await supabase.auth.admin.createUser({
               email: profile.email,
               password: 'password123',
               email_confirm: true,
               user_metadata: { is_demo: profile.is_demo }
           });

           if (userError) {
               console.error(`Failed to create auth user ${profile.email}:`, userError.message);
               // If user already exists, we might still want to upsert profile
               if (!userError.message.includes('already registered')) {
                   errors.push({ email: profile.email, error: userError.message });
                   continue; 
               }
           }
           
           // If user creation succeeded or existed, we try to get the ID.
           // If created: user.user.id
           // If existed: we need to fetch it.
           let userId = user?.user?.id;
           if (!userId && profile.email) {
               // Try to find user by email (Admin function)
                const { data: list } = await supabase.auth.admin.listUsers();
                const found = list.users.find(u => u.email === profile.email);
                if (found) userId = found.id;
           }

           if (userId) {
               const { error: profileError } = await supabase.from('profiles').upsert({
                   ...profile,
                   id: userId
               });
               if (profileError) {
                   console.error(`Failed to insert profile for ${userId}:`, profileError.message);
                   errors.push({ email: profile.email, error: profileError.message });
               } else {
                   successCount++;
               }
           }
        }

        res.json({ message: 'Seeding completed', success: successCount, errors });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// GET Potential Matches
// Params: userId, gender (of the requestor)
app.get('/api/matches/potential', async (req, res) => {
    const { userId, gender } = req.query;
    if (!userId || !gender) return res.status(400).json({ error: 'userId and gender required' });

    const targetGender = gender === 'Male' ? 'Female' : 'Male';

    // Get IDs user has already interacted with
    const { data: interactions } = await supabase
        .from('interactions')
        .select('toUserId')
        .eq('fromUserId', userId);
    
    const ignoredIds = interactions?.map(i => i.toUserId) || [];
    ignoredIds.push(userId as string); // Exclude self

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('gender', targetGender);
    
    if (error) return res.status(500).json({ error: error.message });

    // Filter in memory (or could do 'not.in' in SQL)
    const filtered = profiles.filter(p => !ignoredIds.includes(p.id));
    res.json(filtered);
});

// Record Interaction
app.post('/api/interactions', async (req, res) => {
    const { fromUserId, toUserId, type } = req.body;
    
    // Upsert interaction
    const { error } = await supabase
        .from('interactions')
        .upsert({
            fromUserId,
            toUserId,
            type,
            timestamp: Date.now()
        });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// Get "You Liked"
app.get('/api/matches/liked', async (req, res) => {
    const { userId } = req.query;
    
    // Get IDs user liked
    const { data: interactions } = await supabase
        .from('interactions')
        .select('toUserId')
        .eq('fromUserId', userId)
        .eq('type', 'INTERESTED');
    
    const likedIds = interactions?.map(i => i.toUserId) || [];
    if (likedIds.length === 0) return res.json([]);

    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', likedIds);
        
    res.json(profiles || []);
});

// Get "Liked You"
app.get('/api/matches/liked-by', async (req, res) => {
    const { userId } = req.query;
    
    const { data: interactions } = await supabase
        .from('interactions')
        .select('fromUserId')
        .eq('toUserId', userId)
        .eq('type', 'INTERESTED');

    const likerIds = interactions?.map(i => i.fromUserId) || [];
    if (likerIds.length === 0) return res.json([]);

    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', likerIds);

    res.json(profiles || []);
});

// Get Mutual Matches
app.get('/api/matches/mutual', async (req, res) => {
    const { userId } = req.query;

    // 1. Who did I like?
    const { data: myLikes } = await supabase
        .from('interactions')
        .select('toUserId')
        .eq('fromUserId', userId)
        .eq('type', 'INTERESTED');
    
    const myLikeIds = myLikes?.map(i => i.toUserId) || [];

    if (myLikeIds.length === 0) return res.json([]);

    // 2. Who liked me back? (Only check within those I liked)
    const { data: mutuals } = await supabase
        .from('interactions')
        .select('fromUserId')
        .in('fromUserId', myLikeIds)
        .eq('toUserId', userId)
        .eq('type', 'INTERESTED');
    
    const mutualIds = mutuals?.map(i => i.fromUserId) || [];

    if (mutualIds.length === 0) return res.json([]);

    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', mutualIds);

    res.json(profiles || []);
});

export default app;
