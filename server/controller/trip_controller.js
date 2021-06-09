const Trip = require('../model/trip_model')

const createTrip = async (req, res, next) => {
    let { id } = req.user;
    let now1 = new Date(new Date().setHours(0,0,0,0));
    let start = new Date (now1.setDate(now1.getDate() + 30));
    console.log(start);
    let now2 = new Date(new Date().setHours(0,0,0,0));
    let end = new Date (now2.setDate(now2.getDate() + 37));
    console.log(end);
    let initTrip = {
        name: '未命名行程',
        trip_start: start,
        trip_end: end,
        day_start: "0900",
        day_end: "2000",
        is_archived: 0,
        user_id: id,
        image: '/images/bg.jpg'
    }
    let result = await Trip.createTrip(initTrip);
    res.status(200).send({tripId: result});
}

const getTripSettings = async (req, res, next) => {
    let userId = req.user.id;
    let tripId = req.query.id;
    let result =  await Trip.getTripSettings(userId, tripId);
    result.duration = (result.trip_end - result.trip_start) / (1000 * 60 * 60 * 24);
    res.status(200).send(result);
}

const modifyTripSettings = async (req, res, next) => {
    let { tripId, tripStart, tripEnd, modify, tripName, archived } = req.body;
    tripStart = new Date(tripStart);
    tripEnd = new Date(tripEnd);
    if ((tripEnd - tripStart)/(1000*60*60*24) > 20) {
        res.sendStatus(500)
    }
    if(modify == 'duration') {
        let result = await Trip.updateDuration(tripId, tripStart, tripEnd);
        if (result.error) {
            res.sendStatus(500)
        } else {
            res.sendStatus(200)
        }
    } else if (modify == 'name') {
        let result = await Trip.updateName(tripId, tripName);
        if (result.error) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    } else if (modify == 'archived') {
        let result = await Trip.archiveTrip(tripId, archived);
        if (result.error) {
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    }

}

module.exports = {
    createTrip,
    modifyTripSettings,
    getTripSettings
}