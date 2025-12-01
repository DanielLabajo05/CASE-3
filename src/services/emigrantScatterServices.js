// emigrantScatterServices.js
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const COLLECTION_NAME = 'emigrants_occupation'; // or whatever you named it

export const getEmigrantsByOccupation = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching occupation data:', error);
    throw error;
  }
};

export const bulkAddOccupationEmigrants = async (data) => {
  try {
    const promises = data.map(item => addDoc(collection(db, COLLECTION_NAME), item));
    await Promise.all(promises);
    return { count: data.length };
  } catch (error) {
    console.error('Error adding occupation data:', error);
    throw error;
  }
};

export const deleteEmigrantByOccupation = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error('Error deleting occupation data:', error);
    throw error;
  }
};