/**
 * Common database helper functions.
 */

const IDB_DATABASE = "restaurantDatabase";
const IDB_OBJECT = "restaurantObject";

class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /*
   * Create connection with Index db
   */
  static openIDBConnection() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    return idb.open(IDB_DATABASE, 1, upgradeDatabase => {
      const store = upgradeDatabase.createObjectStore(IDB_OBJECT, {
        keyPath: "id"
      });
      store.createIndex("by-id", "id");
    });
  }

  /*
   * Save data to IDB database
   */
  static saveToIDB(data) {
    return DBHelper.openIDBConnection().then(db => {
      if (!db) {
        return;
      }
      const tx = db.transaction(IDB_OBJECT, "readwrite");
      const store = tx.objectStore(IDB_OBJECT);
      data.forEach(restaurant => {
        store.put(restaurant);
      });
      return tx.complete;
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurantsFromAPI() {
    return fetch(DBHelper.DATABASE_URL).then(res =>
      res.json().then(restaurants => {
        DBHelper.saveToIDB(restaurants);
        return restaurants;
      })
    );
  }

  static async fetchRestaurants(cb) {
    return DBHelper.fetchCachedRestaurants()
      .then(restaurants => {
        if (restaurants.length) {
          return Promise.resolve(restaurants);
        } else {
          return DBHelper.fetchRestaurantsFromAPI();
        }
      })
      .then(restaurants => {
        cb(null, restaurants);
      })
      .catch(error => {
        cb(error, null);
      });
  }

  /**
   * Get cached restaurants from IDB.
   */
  static fetchCachedRestaurants() {
    return DBHelper.openIDBConnection().then(db => {
      if (!db) {
        return;
      }
      const store = db.transaction(IDB_OBJECT).objectStore(IDB_OBJECT);
      return store.getAll();
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback("Restaurant does not exist", null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != "all") {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != "all") {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph) {
      return `/img/${restaurant.photograph}.jpg`;
    }
    return "https://placehold.it/800x400";
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }
}
