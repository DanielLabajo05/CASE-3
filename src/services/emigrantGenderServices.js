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

const COLLECTION_NAME = 'emigrantsByGender';

// Add single gender record with FIELDS
export const addEmigrantByGender = async (data) => {
  try {
    // Use year as document ID
    const docRef = doc(db, COLLECTION_NAME, String(data.year));
    
    // Create the document with fields
    const docData = {
      year: Number(data.year),
      male: Number(data.male) || 0,
      female: Number(data.female) || 0,
      total: Number(data.male || 0) + Number(data.female || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Saving to Firebase:', docData);
    
    await setDoc(docRef, docData, { merge: true });
    
    return { id: String(data.year), ...docData };
  } catch (error) {
    console.error('Error adding gender data:', error);
    throw error;
  }
};

// Bulk add multiple records
export const bulkAddEmigrants = async (dataArray) => {
  try {
    console.log('Starting bulk add of', dataArray.length, 'records');
    
    const promises = dataArray.map(data => {
      console.log('Processing:', data);
      return addEmigrantByGender(data);
    });
    
    const results = await Promise.all(promises);
    
    console.log('✅ Bulk add complete:', results.length, 'records saved');
    
    return { 
      success: true, 
      count: results.length,
      message: `Successfully saved ${results.length} gender records to Firebase`
    };
  } catch (error) {
    console.error('❌ Error in bulk add:', error);
    throw error;
  }
};

// Get all gender records
export const getEmigrantsByGender = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('year', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const data = [];
    querySnapshot.forEach((docSnap) => {
      const docData = docSnap.data();
      data.push({
        id: docSnap.id,
        year: docData.year,
        male: docData.male,
        female: docData.female,
        total: docData.total
      });
    });
    
    console.log('Loaded from Firebase:', data.length, 'gender records');
    return data;
  } catch (error) {
    console.error('Error getting gender data:', error);
    return []; // Return empty array instead of throwing
  }
};

// Delete gender record by year
export const deleteEmigrantByGender = async (yearOrId) => {
  try {
    const docId = String(yearOrId);
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
    console.log('Deleted document:', docId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting gender data:', error);
    throw error;
  }
};