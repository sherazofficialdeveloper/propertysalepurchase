/**
 * Favorites routes.
 *   GET    /api/favorites                          → populated list
 *   GET    /api/favorites/ids                      → lightweight ids
 *   GET    /api/favorites/:propertyId/status       → is-favorited check
 *   POST   /api/favorites/:propertyId              → add
 *   DELETE /api/favorites/:propertyId              → remove
 */
const express = require('express');
const {
  addFavorite, removeFavorite, listFavorites, listFavoriteIds, favoriteStatus,
} = require('../controllers/favorite.controller');
const { authenticateUser } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/authorize');
const router = express.Router();

router.use(authenticateUser);

router.get('/', listFavorites);
router.get('/ids', listFavoriteIds);
router.get('/:propertyId/status', favoriteStatus);
router.post('/:propertyId', authorizeRoles('buyer', 'seller', 'admin'), addFavorite);
router.delete('/:propertyId', authorizeRoles('buyer', 'seller', 'admin'), removeFavorite);

module.exports = router;
