const jwt = require('jsonwebtoken');
const validator = require('email-validator');
const Trip = require('../model/trip_model');
const User = require('../model/user_model');
const Share = require('../model/share_model');

const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { keyword, archived, shared } = req.query;
    let result;
    if (keyword) {
      result = await Trip.getDashboard(userId, 'search', keyword);
    } else if (archived) {
      result = await Trip.getDashboard(userId, 'archived');
    } else if (shared) {
      result = await Trip.getDashboard(userId, 'shared');
    } else {
      result = await Trip.getDashboard(userId);
    }
    res.send(result);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const signUp = async (req, res, next) => {
  try {
    const { email, password, shareToken } = req.body;
    if (!validator.validate(email)) {
      res.sendStatus(400);
    }
    const result = await User.signUp(email, password);
    if (result.error) {
      res.status(result.statusCode).send(result.error);
    } else {
      const response = {
        data: {
          access_token: result.access_token,
          access_expired: 28800,
          user: {
            id: result.id,
            name: result.name,
            email: result.email,
          },
        },
      };
      if (shareToken) {
        jwt.verify(shareToken, process.env.SHARE_TOKEN_SECRET, async (err, jwtResult) => {
          if (err) {
            res.sendStatus(403);
          }
          const update = await Share.updateShareAccess(response.data.user.id, shareToken);
          if (update.error) {
            res.status(403).send(update.error);
          } else {
            response.tripId = jwtResult.tripId;
            res.status(200).send(response);
          }
        });
      } else {
        res.status(200).send(response);
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const signIn = async (req, res, next) => {
  try {
    const {
      email, password, shareToken, provider,
    } = req.body;

    if (!validator.validate(email)) {
      res.sendStatus(400);
    }
    let result;
    if (provider === 'Google') {
      result = await User.googleSignIn(email);
    } else {
      result = await User.nativeSignIn(email, password);
    }

    if (result.error) {
      res.status(result.statusCode).send(result.error);
    } else {
      const response = {
        data: {
          access_token: result.access_token,
          access_expired: 28800,
          user: {
            id: result.id,
            name: result.name,
            email: result.email,
          },
        },
      };
      if (shareToken) {
        jwt.verify(shareToken, process.env.SHARE_TOKEN_SECRET, async (err, jwtResult) => {
          if (err) {
            res.status(403).send('wrong token');
          }
          const update = await Share.updateShareAccess(response.data.user.id, shareToken);
          if (update.error) {
            res.status(403).send(update.error);
          } else {
            response.tripId = jwtResult.tripId;
            res.status(200).send(response);
          }
        });
      } else {
        res.status(200).send(response);
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  signIn,
  signUp,
  getDashboard,
};
