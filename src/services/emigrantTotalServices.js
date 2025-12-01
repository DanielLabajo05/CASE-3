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

const COLLECTION_NAME = 'emigrantsByTotal';

// Add single total record with FIELDS
export const addEmigrantByTotal = async (data) => {
  try {
    // Use year as document ID
    const docRef = doc(db, COLLECTION_NAME, String(data.year));
    
    // Create the document with fields
    const docData = {
      year: Number(data.year),
      total: Number(data.total) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Saving total data to Firebase:', docData);
    
    await setDoc(docRef, docData, { merge: true });
    
    return { id: String(data.year), ...docData };
  } catch (error) {
    console.error('Error adding total data:', error);
    throw error;
  }
};

// Bulk add multiple records
export const bulkAddTotalEmigrants = async (dataArray) => {
  try {
    console.log('Starting bulk add of', dataArray.length, 'total records');
    
    const promises = dataArray.map(data => {
      console.log('Processing total data:', data);
      return addEmigrantByTotal(data);
    });
    
    const results = await Promise.all(promises);
    
    console.log('✅ Bulk add complete:', results.length, 'total records saved');
    
    return { 
      success: true, 
      count: results.length,
      message: `Successfully saved ${results.length} total records to Firebase`
    };
  } catch (error) {
    console.error('❌ Error in bulk add total:', error);
    throw error;
  }
};

// Get all total records
export const getEmigrantsByTotal = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('year', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const data = [];
    querySnapshot.forEach((docSnap) => {
      const docData = docSnap.data();
      data.push({
        id: docSnap.id,
        year: docData.year,
        total: docData.total
      });
    });
    
    console.log('Loaded from Firebase:', data.length, 'total records');
    return data;
  } catch (error) {
    console.error('Error getting total data:', error);
    return []; // Return empty array instead of throwing
  }
};

// Delete total record by year
export const deleteEmigrantByTotal = async (yearOrId) => {
  try {
    const docId = String(yearOrId);
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
    console.log('Deleted total document:', docId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting total data:', error);
    throw error;
  }
};