import { supabase } from './supabase';

const CLIENT_ID = "222057";
const CLIENT_SECRET = "9c322a07f63c80c988e8b4cd20499cb831efdf07";

/**
 * Refreshes the Strava Access Token if needed.
 * Returns the valid access token.
 */
export const refreshStravaToken = async (userId, refreshToken) => {
    try {
        const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        if (!response.ok) throw new Error('Failed to refresh Strava token');

        const data = await response.json();
        
        // Update DB with new tokens
        await supabase.from('profiles').update({
            strava_access_token: data.access_token,
            strava_refresh_token: data.refresh_token
        }).eq('id', userId);

        return data.access_token;
    } catch (error) {
        console.error("Error refreshing Strava token:", error);
        return null;
    }
};

/**
 * Syncs recent Strava activities to Supabase workout_logs.
 */
export const syncStravaActivities = async (userId, accessToken, refreshToken) => {
    try {
        // Try fetching activities
        let response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        // If unauthorized, refresh token
        if (response.status === 401) {
            console.log("Strava token expired, refreshing...");
            accessToken = await refreshStravaToken(userId, refreshToken);
            if (!accessToken) throw new Error("Could not refresh token");

            // Retry
            response = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=30', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        }

        if (!response.ok) throw new Error('Failed to fetch Strava activities');

        const activities = await response.json();
        const logsToInsert = [];

        // Add each activity to the array
        for (const activity of activities) {
            // Only care about Run, Swim, Ride for now
            if (!['Run', 'Swim', 'Ride', 'VirtualRide', 'VirtualRun'].includes(activity.type)) {
                continue;
            }

            // Prepare log
            logsToInsert.push({
                user_id: userId,
                // workout_id is null since it's an external activity
                started_at: activity.start_date,
                completed_at: new Date(new Date(activity.start_date).getTime() + activity.elapsed_time * 1000).toISOString(),
                status: 'completed',
                strava_activity_id: activity.id,
                activity_type: activity.type,
                distance_meters: activity.distance,
                moving_time_seconds: activity.moving_time,
                external_title: activity.name,
                notes: 'Synced from Strava'
            });
        }

        if (logsToInsert.length > 0) {
            // Upsert based on strava_activity_id (we need to handle it per activity, 
            // since Supabase's `upsert` handles unique constraints nicely)
            const { data, error } = await supabase
                .from('workout_logs')
                .upsert(logsToInsert, { onConflict: 'strava_activity_id' });

            if (error) {
                console.error("Supabase strava upsert error:", error);
                throw error;
            }
            return logsToInsert.length;
        }

        return 0;
    } catch (error) {
        console.error("Error syncing Strava activities:", error);
        throw error;
    }
};
