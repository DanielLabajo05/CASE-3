// services/emigrantServices.js
import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  where
} from 'firebase/firestore';

// This should be your ACTUAL historical data collection name
// Change this to whatever your real collection is called
const COLLECTION_NAME = 'emigrants'; // or 'emigrantData', 'historicalEmigrants', etc.

/**
 * Get all ACTUAL historical emigrants data from Firebase
 * This is the data you want to use for TRAINING the forecast model
 */
export const getHistoricalEmigrants = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('year', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const emigrants = [];
    
    querySnapshot.forEach((doc) => {
      emigrants.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Retrieved ${emigrants.length} historical records from Firebase`);
    return emigrants;
  } catch (error) {
    console.error('Error getting historical emigrants:', error);
    throw error;
  }
};

/**
 * Add a single historical emigrant record to Firebase
 */
export const addHistoricalEmigrant = async (emigrantData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...emigrantData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Historical emigrant added with ID:', docRef.id);
    return { id: docRef.id, ...emigrantData };
  } catch (error) {
    console.error('Error adding historical emigrant:', error);
    throw error;
  }
};

/**
 * Bulk add historical emigrants data to Firebase
 */
export const bulkAddHistoricalEmigrants = async (emigrantsArray) => {
  try {
    console.log(`Starting bulk upload of ${emigrantsArray.length} historical records...`);
    
    const promises = emigrantsArray.map(emigrant => 
      addDoc(collection(db, COLLECTION_NAME), {
        year: emigrant.year,
        total: emigrant.total || 0,
        male: emigrant.male || 0,
        female: emigrant.female || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    );
    
    await Promise.all(promises);
    
    console.log(`Successfully uploaded ${emigrantsArray.length} historical records to Firebase`);
    return { 
      success: true, 
      count: emigrantsArray.length,
      message: `${emigrantsArray.length} historical records saved successfully`
    };
  } catch (error) {
    console.error('Error in bulk upload of historical emigrants:', error);
    throw error;
  }
};

/**
 * Delete a single historical emigrant record by ID
 */
export const deleteHistoricalEmigrant = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    console.log('Historical emigrant deleted:', id);
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting historical emigrant:', error);
    throw error;
  }
};

/**
 * Delete all historical emigrants data
 */
export const deleteAllHistoricalEmigrants = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const deletePromises = [];
    
    querySnapshot.forEach((document) => {
      deletePromises.push(deleteDoc(doc(db, COLLECTION_NAME, document.id)));
    });
    
    await Promise.all(deletePromises);
    console.log(`Deleted ${deletePromises.length} historical records from Firebase`);
    
    return { 
      success: true, 
      count: deletePromises.length,
      message: `${deletePromises.length} historical records deleted`
    };
  } catch (error) {
    console.error('Error deleting all historical emigrants:', error);
    throw error;
  }
};

/**
 * Get historical emigrants by year
 */
export const getHistoricalEmigrantsByYear = async (year) => {
  try {
    const emigrants = await getHistoricalEmigrants();
    return emigrants.filter(e => e.year === year);
  } catch (error) {
    console.error('Error getting historical emigrants by year:', error);
    throw error;
  }
};

/**
 * Get historical emigrants by year range
 */
export const getHistoricalEmigrantsByYearRange = async (startYear, endYear) => {
  try {
    const emigrants = await getHistoricalEmigrants();
    return emigrants.filter(e => e.year >= startYear && e.year <= endYear);
  } catch (error) {
    console.error('Error getting historical emigrants by year range:', error);
    throw error;
  }
};