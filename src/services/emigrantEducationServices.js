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

const COLLECTION_NAME = 'emigrantsByEducation';

// Add single education record with FIELDS
export const addEmigrantByEducation = async (data) => {
  try {
    // Use year as document ID
    const docRef = doc(db, COLLECTION_NAME, String(data.year));
    
    // Create the document with fields
    const docData = {
      year: Number(data.year),
      elementary: Number(data.elementary) || 0,
      highSchool: Number(data.highSchool) || 0,
      college: Number(data.college) || 0,
      postgraduate: Number(data.postgraduate) || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Saving education data to Firebase:', docData);
    
    await setDoc(docRef, docData, { merge: true });
    
    return { id: String(data.year), ...docData };
  } catch (error) {
    console.error('Error adding education data:', error);
    throw error;
  }
};

// Bulk add multiple records
export const bulkAddEducationEmigrants = async (dataArray) => {
  try {
    console.log('Starting bulk add of', dataArray.length, 'education records');
    
    const promises = dataArray.map(data => {
      console.log('Processing education data:', data);
      return addEmigrantByEducation(data);
    });
    
    const results = await Promise.all(promises);
    
    console.log('✅ Bulk add complete:', results.length, 'education records saved');
    
    return { 
      success: true, 
      count: results.length,
      message: `Successfully saved ${results.length} education records to Firebase`
    };
  } catch (error) {
    console.error('❌ Error in bulk add education:', error);
    throw error;
  }
};

// Get all education records
export const getEmigrantsByEducation = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('year', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const data = [];
    querySnapshot.forEach((docSnap) => {
      const docData = docSnap.data();
      data.push({
        id: docSnap.id,
        year: docData.year,
        elementary: docData.elementary,
        highSchool: docData.highSchool,
        college: docData.college,
        postgraduate: docData.postgraduate
      });
    });
    
    console.log('Loaded from Firebase:', data.length, 'education records');
    return data;
  } catch (error) {
    console.error('Error getting education data:', error);
    return []; // Return empty array instead of throwing
  }
};

// Delete education record by year
export const deleteEmigrantByEducation = async (yearOrId) => {
  try {
    const docId = String(yearOrId);
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
    console.log('Deleted education document:', docId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting education data:', error);
    throw error;
  }
};
