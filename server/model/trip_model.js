const { pool } = require('./mysql');

const getDashboard = async (userId, behavior, keyword) => {
    try {
        let sql = {
            query: 'SELECT trips.id AS trip_id, name, image, trip_start, trip_end FROM trips ',
            conditions: [0 , userId]
        }
        if (behavior == "search") {
            sql.query = sql.query.concat('WHERE is_archived = ? AND user_id = ? AND name LIKE ?');
            sql.conditions.push(`%${keyword}%`)
        } else if (behavior == "archived") {
            sql.query = sql.query.concat('WHERE is_archived = ? AND user_id = ?');
            sql.conditions[0] = 1;
        } else if (behavior == "shared") {
            sql.query = sql.query.concat('JOIN contributors ON trips.id = contributors.trip_id WHERE is_archived = ? AND contributors.user_id = ?')
        } else {                       
            sql.query = sql.query.concat('WHERE is_archived = ? AND user_id = ?');
        }
        let result = await pool.query(sql.query, sql.conditions);
        let trips = result[0].map(trip => {
            if (trip.name.length > 20) {
                return {
                    trip_id: trip.trip_id,
                    name: trip.name.slice(0,20) + ' . . .',
                    image: trip.image, 
                    trip_start: trip.trip_start, 
                    trip_end: trip.trip_end
                }
            } else {
                return trip
            }
        })
        return {data: trips};
    } catch (error) {
        console.log(error);
    }
}

const createTrip = async (initTrip) => {
    try {
        let result = await pool.query('INSERT INTO trips SET ? ', initTrip);
        return result[0].insertId;
    } catch (error) {
        console.log(error);
    }
}

const getTripSettings = async (userId, tripId) => {
    try {
        let tripsOfUser = await pool.query('SELECT id, name FROM trips WHERE is_archived = 0 AND user_id = ?', userId);
        let tripSettings = await pool.query('SELECT * FROM trips WHERE id = ?', tripId);
        let response = tripSettings[0][0];
        response.otherTrips = tripsOfUser[0];
        //slice too long name for rendering to Front End
        response.otherTrips = response.otherTrips.map(trip => {
            if (trip.name.length > 20) {
                return {
                    id: trip.id,
                    name: trip.name.slice(0,20) + ' . . .'
                }
            } else {
                return trip
            }
        })
        return response;
    } catch (error) {
        console.log(error);
    }
}

const updateDuration = async (tripId, tripStart, tripEnd) => {
    try {
        let conditions = [tripStart, tripEnd, tripId];
        await pool.query('UPDATE trips SET trip_start = ?, trip_end = ? WHERE id = ?', conditions);
        return true;
    } catch (error) {
        return {error}
    }
}

const updateName = async (tripId, tripName) => {
    try {
        let conditions = [tripName, tripId];
        await pool.query('UPDATE trips SET name = ? WHERE id = ?', conditions);
        return true;
    } catch (error) {
        return {error}
    }
}

const archiveTrip = async (tripId, action) => {
    try {
        let conditions = [action, tripId];
        await pool.query('UPDATE trips SET is_archived = ? WHERE id = ?', conditions);
        return true;
    } catch (error) {
        return {error}
    }
}

const updateImage = async (tripId, image) => {
    try {
        let conditions = [image, tripId];
        await pool.query('UPDATE trips SET image = ? WHERE id = ?', conditions);        
    } catch (error) {
        return {error}
    }
}

module.exports = {
    getDashboard,
    createTrip,
    getTripSettings,
    updateDuration,
    updateName,
    archiveTrip,
    updateImage
}