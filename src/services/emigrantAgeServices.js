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

const COLLECTION_NAME = 'emigrantsByAge';

// Add single age record with FIELDS
export const addEmigrantByAge = async (data) => {
  try {
    // Use a combination of year and ageGroup as document ID
    const docId = `${data.year}_${data.ageGroup}`;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    // Create the document with fields
    const docData = {
      year: Number(data.year),
      ageGroup: String(data.ageGroup),
      count: Number(data.count) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Saving age data to Firebase:', docData);
    
    await setDoc(docRef, docData, { merge: true });
    
    return { id: docId, ...docData };
  } catch (error) {
    console.error('Error adding age data:', error);
    throw error;
  }
};

// Bulk add multiple records
export const bulkAddAgeEmigrants = async (dataArray) => {
  try {
    console.log('Starting bulk add of', dataArray.length, 'age records');
    
    const promises = dataArray.map(data => {
      console.log('Processing age data:', data);
      return addEmigrantByAge(data);
    });
    
    const results = await Promise.all(promises);
    
    console.log('✅ Bulk add complete:', results.length, 'age records saved');
    
    return { 
      success: true, 
      count: results.length,
      message: `Successfully saved ${results.length} age records to Firebase`
    };
  } catch (error) {
    console.error('❌ Error in bulk add age:', error);
    throw error;
  }
};

// Get all age records
export const getEmigrantsByAge = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('year', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const data = [];
    querySnapshot.forEach((docSnap) => {
      const docData = docSnap.data();
      data.push({
        id: docSnap.id,
        year: docData.year,
        ageGroup: docData.ageGroup,
        count: docData.count
      });
    });
    
    console.log('Loaded from Firebase:', data.length, 'age records');
    return data;
  } catch (error) {
    console.error('Error getting age data:', error);
    return []; // Return empty array instead of throwing
  }
};

// Delete age record by ID
export const deleteEmigrantByAge = async (id) => {
  try {
    const docId = String(id);
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
    console.log('Deleted age document:', docId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting age data:', error);
    throw error;
  }
};