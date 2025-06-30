import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface Product {
  name: string;
  rate: number;
  category: string;
}

export interface CartItem {
  name: string;
  qty: number;
  rate: number;
}

export interface Order {
  items: CartItem[];
  paymentMode: string;
}

export interface GoogleSheet {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

interface AppContextType {
  products: Product[];
  productCategories: string[];
  selectedCategory: string;
  orders: Order[];
  currentOrderIndex: number;
  googleSheets: GoogleSheet[];
  activeSheet: GoogleSheet | null;
  loadProducts: () => Promise<void>;
  setSelectedCategory: (category: string) => void;
  addToCart: (productName: string, rate: number) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, delta: number) => void;
  addNewOrder: () => void;
  removeOrder: (index: number) => void;
  switchOrder: (index: number) => void;
  setPaymentMode: (mode: string) => void;
  submitOrder: () => Promise<boolean>;
  addGoogleSheet: (name: string, url: string) => Promise<void>;
  removeGoogleSheet: (id: string) => Promise<void>;
  setActiveSheet: (id: string) => Promise<void>;
  testSheetConnection: (url: string) => Promise<boolean>;
  // Legacy support
  googleSheetsUrl: string;
  setGoogleSheetsUrl: (url: string) => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Default Google Sheets URL - Energy Palace permanent configuration
const DEFAULT_GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxu2BY75DKrObAuoZr3aCahJNriDb8L_r4kcB4lp-kzVh8mIcCr0J2Bvs_xKEBfqrGu-Q/exec';

// Platform-specific storage helpers
const getStorageItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([{ items: [], paymentMode: '' }]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [googleSheets, setGoogleSheets] = useState<GoogleSheet[]>([]);
  const [activeSheet, setActiveSheetState] = useState<GoogleSheet | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeDefaultSheet();
  }, []);

  const initializeDefaultSheet = async () => {
    try {
      const sheetsData = await getStorageItem('googleSheets');
      const activeSheetId = await getStorageItem('activeSheetId');
      
      if (sheetsData) {
        const sheets: GoogleSheet[] = JSON.parse(sheetsData);
        setGoogleSheets(sheets);
        
        // Set active sheet
        const active = sheets.find(sheet => sheet.id === activeSheetId) || sheets[0];
        if (active) {
          setActiveSheetState(active);
        }
      } else {
        // Initialize with default Energy Palace sheet
        const defaultSheet: GoogleSheet = {
          id: 'energy-palace-main',
          name: 'Energy Palace Main',
          url: DEFAULT_GOOGLE_SHEETS_URL,
          isActive: true
        };
        const sheets = [defaultSheet];
        await setStorageItem('googleSheets', JSON.stringify(sheets));
        await setStorageItem('activeSheetId', 'energy-palace-main');
        await setStorageItem('googleSheetsUrl', DEFAULT_GOOGLE_SHEETS_URL); // Legacy support
        setGoogleSheets(sheets);
        setActiveSheetState(defaultSheet);
      }
    } catch (error) {
      console.error('Error initializing default sheet:', error);
      // Fallback: create default sheet anyway
      const defaultSheet: GoogleSheet = {
        id: 'energy-palace-main',
        name: 'Energy Palace Main',
        url: DEFAULT_GOOGLE_SHEETS_URL,
        isActive: true
      };
      setGoogleSheets([defaultSheet]);
      setActiveSheetState(defaultSheet);
    }
  };

  const saveGoogleSheets = async (sheets: GoogleSheet[]) => {
    try {
      await setStorageItem('googleSheets', JSON.stringify(sheets));
      setGoogleSheets(sheets);
    } catch (error) {
      console.error('Error saving Google Sheets:', error);
    }
  };

  const addGoogleSheet = async (name: string, url: string) => {
    const newSheet: GoogleSheet = {
      id: Date.now().toString(),
      name: name.trim(),
      url: url.trim(),
      isActive: false
    };
    
    const updatedSheets = [...googleSheets, newSheet];
    await saveGoogleSheets(updatedSheets);
  };

  const removeGoogleSheet = async (id: string) => {
    // Prevent removing the main Energy Palace sheet
    if (id === 'energy-palace-main') {
      throw new Error('Cannot remove the main Energy Palace sheet');
    }
    
    const updatedSheets = googleSheets.filter(sheet => sheet.id !== id);
    await saveGoogleSheets(updatedSheets);
    
    // If we removed the active sheet, set the main sheet as active
    if (activeSheet?.id === id) {
      const mainSheet = updatedSheets.find(s => s.id === 'energy-palace-main') || updatedSheets[0];
      if (mainSheet) {
        await setActiveSheet(mainSheet.id);
      }
    }
  };

  const setActiveSheet = async (id: string) => {
    const sheet = googleSheets.find(s => s.id === id);
    if (sheet) {
      setActiveSheetState(sheet);
      await setStorageItem('activeSheetId', id);
      // Update legacy URL for backward compatibility
      await setStorageItem('googleSheetsUrl', sheet.url);
      // Clear products when switching sheets
      setProducts([]);
      setProductCategories([]);
      setSelectedCategory('');
    }
  };

  const testSheetConnection = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(`${url.trim()}?action=getProducts`);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const loadProducts = async () => {
    if (!activeSheet?.url) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${activeSheet.url}?action=getProducts`);
      const data = await response.json();
      
      const productsData: Product[] = [];
      const categories = new Set<string>();
      
      data.forEach((row: any[]) => {
        if (row.length >= 4) {
          const product: Product = {
            name: row[1],
            rate: Number(row[2]),
            category: row[3]
          };
          productsData.push(product);
          categories.add(row[3]);
        }
      });
      
      const sortedCategories = Array.from(categories).sort();
      setProducts(productsData);
      setProductCategories(sortedCategories);
      if (sortedCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(sortedCategories[0]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (productName: string, rate: number) => {
    const newOrders = [...orders];
    const currentOrder = newOrders[currentOrderIndex];
    const existingItemIndex = currentOrder.items.findIndex(item => item.name === productName);
    
    if (existingItemIndex >= 0) {
      currentOrder.items[existingItemIndex].qty += 1;
    } else {
      currentOrder.items.push({ name: productName, qty: 1, rate });
    }
    
    setOrders(newOrders);
  };

  const removeFromCart = (index: number) => {
    const newOrders = [...orders];
    newOrders[currentOrderIndex].items.splice(index, 1);
    setOrders(newOrders);
  };

  const updateQuantity = (index: number, delta: number) => {
    const newOrders = [...orders];
    const item = newOrders[currentOrderIndex].items[index];
    item.qty += delta;
    if (item.qty < 1) item.qty = 1;
    setOrders(newOrders);
  };

  const addNewOrder = () => {
    const newOrders = [...orders, { items: [], paymentMode: '' }];
    setOrders(newOrders);
    setCurrentOrderIndex(newOrders.length - 1);
  };

  const removeOrder = (index: number) => {
    if (orders.length === 1) return;
    const newOrders = orders.filter((_, i) => i !== index);
    setOrders(newOrders);
    const newIndex = Math.max(0, currentOrderIndex - (index <= currentOrderIndex ? 1 : 0));
    setCurrentOrderIndex(newIndex);
  };

  const switchOrder = (index: number) => {
    setCurrentOrderIndex(index);
  };

  const setPaymentMode = (mode: string) => {
    const newOrders = [...orders];
    newOrders[currentOrderIndex].paymentMode = mode;
    setOrders(newOrders);
  };

  const submitOrder = async (): Promise<boolean> => {
    const currentOrder = orders[currentOrderIndex];
    if (!currentOrder.items.length || !currentOrder.paymentMode || !activeSheet?.url) {
      return false;
    }

    try {
      const date = new Date().toLocaleDateString();
      const promises = currentOrder.items.map(item => {
        const formData = new FormData();
        formData.append('action', 'submitOrder');
        formData.append('date', date);
        formData.append('item', item.name);
        formData.append('qty', item.qty.toString());
        formData.append('rate', item.rate.toString());
        formData.append('total', (item.qty * item.rate).toString());
        formData.append('payMode', currentOrder.paymentMode);
        return fetch(activeSheet.url, { method: 'POST', body: formData });
      });

      await Promise.all(promises);
      
      // Reset current order
      const newOrders = [...orders];
      newOrders[currentOrderIndex] = { items: [], paymentMode: '' };
      setOrders(newOrders);
      
      return true;
    } catch (error) {
      console.error('Error submitting order:', error);
      return false;
    }
  };

  // Legacy support
  const setGoogleSheetsUrl = async (url: string) => {
    try {
      await setStorageItem('googleSheetsUrl', url);
      // Update the main sheet URL
      const updatedSheets = googleSheets.map(sheet => 
        sheet.id === 'energy-palace-main' ? { ...sheet, url } : sheet
      );
      await saveGoogleSheets(updatedSheets);
      if (activeSheet?.id === 'energy-palace-main') {
        setActiveSheetState({ ...activeSheet, url });
      }
    } catch (error) {
      console.error('Error saving Google Sheets URL:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      products,
      productCategories,
      selectedCategory,
      orders,
      currentOrderIndex,
      googleSheets,
      activeSheet,
      loadProducts,
      setSelectedCategory,
      addToCart,
      removeFromCart,
      updateQuantity,
      addNewOrder,
      removeOrder,
      switchOrder,
      setPaymentMode,
      submitOrder,
      addGoogleSheet,
      removeGoogleSheet,
      setActiveSheet,
      testSheetConnection,
      // Legacy support
      googleSheetsUrl: activeSheet?.url || DEFAULT_GOOGLE_SHEETS_URL,
      setGoogleSheetsUrl,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}