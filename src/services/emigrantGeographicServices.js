import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  query,
  orderBy 
} from 'firebase/firestore';

const COLLECTION_NAME = 'emigrantsByGeography';

// Add single geographic record
export const addEmigrantByGeography = async (data) => {
  try {
    // Use combination of year and country as document ID
    const docId = `${data.year}_${data.country.replace(/\s+/g, '_')}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    // Create the document with fields
    const docData = {
      year: Number(data.year),
      country: String(data.country),
      count: Number(data.count) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Saving geographic data to Firebase:', docData);
    
    await setDoc(docRef, docData, { merge: true });
    
    return { id: docId, ...docData };
  } catch (error) {
    console.error('Error adding geographic data:', error);
    throw error;
  }
};

// Bulk add multiple records
export const bulkAddGeographicEmigrants = async (dataArray) => {
  try {
    console.log('Starting bulk add of', dataArray.length, 'geographic records');
    
    const promises = dataArray.map(data => {
      console.log('Processing geographic data:', data);
      return addEmigrantByGeography(data);
    });
    
    const results = await Promise.all(promises);
    
    console.log('✅ Bulk add complete:', results.length, 'geographic records saved');
    
    return { 
      success: true, 
      count: results.length,
      message: `Successfully saved ${results.length} geographic records to Firebase`
    };
  } catch (error) {
    console.error('❌ Error in bulk add geographic:', error);
    throw error;
  }
};

// Get all geographic records
export const getEmigrantsByGeography = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('year', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const data = [];
    querySnapshot.forEach((docSnap) => {
      const docData = docSnap.data();
      data.push({
        id: docSnap.id,
        year: docData.year,
        country: docData.country,
        count: docData.count
      });
    });
    
    console.log('Loaded from Firebase:', data.length, 'geographic records');
    return data;
  } catch (error) {
    console.error('Error getting geographic data:', error);
    return []; // Return empty array instead of throwing
  }
};

// Delete geographic record by ID
export const deleteEmigrantByGeography = async (docId) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
    console.log('Deleted geographic document:', docId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting geographic data:', error);
    throw error;
  }
};