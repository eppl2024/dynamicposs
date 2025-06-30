import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, X, Minus, Search } from 'lucide-react-native';

export default function OrdersScreen() {
  const { user } = useAuth();
  const {
    products,
    productCategories,
    selectedCategory,
    orders,
    currentOrderIndex,
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
    googleSheetsUrl,
    isLoading
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (googleSheetsUrl && products.length === 0) {
      loadProducts();
    }
  }, [googleSheetsUrl]);

  const filteredProducts = products
    .filter(p => p.category === selectedCategory)
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const currentOrder = orders[currentOrderIndex] || { items: [], paymentMode: '' };
  const orderTotal = currentOrder.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);

  const handleSubmitOrder = async () => {
    if (!currentOrder.items.length) {
      Alert.alert('Error', 'Add items to cart');
      return;
    }
    if (!currentOrder.paymentMode) {
      Alert.alert('Error', 'Select payment mode');
      return;
    }

    const success = await submitOrder();
    if (success) {
      Alert.alert('Success', 'Order submitted successfully!');
    } else {
      Alert.alert('Error', 'Failed to submit order');
    }
  };

  if (!googleSheetsUrl) {
    return (
      <LinearGradient colors={['#e3f2fd', '#fce4ec']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.setupContainer}>
            <Text style={styles.setupTitle}>Setup Required</Text>
            <Text style={styles.setupText}>
              Please configure your Google Sheets URL in Settings to get started.
            </Text>
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <Text style={styles.setupButtonText}>Go to Settings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#e3f2fd', '#fce4ec']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Order Tabs */}
          <View style={styles.orderTabs}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.orderTabsContainer}>
                {orders.map((_, index) => (
                  <View key={index} style={styles.orderTabWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.orderTab,
                        currentOrderIndex === index && styles.orderTabActive
                      ]}
                      onPress={() => switchOrder(index)}
                    >
                      <Text style={[
                        styles.orderTabText,
                        currentOrderIndex === index && styles.orderTabActiveText
                      ]}>
                        Order {index + 1}
                      </Text>
                    </TouchableOpacity>
                    {orders.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeOrderButton}
                        onPress={() => removeOrder(index)}
                      >
                        <X size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity style={styles.addOrderButton} onPress={addNewOrder}>
                  <Plus size={20} color="#1976d2" />
                  <Text style={styles.addOrderText}>New</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
            {productCategories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonActiveText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Products Grid */}
          <View style={styles.productsGrid}>
            {filteredProducts.map((product, index) => (
              <TouchableOpacity
                key={`${product.name}-${index}`}
                style={styles.productCard}
                onPress={() => addToCart(product.name, product.rate)}
              >
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>Rs. {product.rate}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cart */}
          <View style={styles.cartContainer}>
            <Text style={styles.cartTitle}>Cart (Order {currentOrderIndex + 1})</Text>
            {currentOrder.items.length === 0 ? (
              <Text style={styles.emptyCart}>Cart is empty</Text>
            ) : (
              <>
                {currentOrder.items.map((item, index) => (
                  <View key={index} style={styles.cartItem}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>Rs. {item.rate} × {item.qty}</Text>
                    </View>
                    <View style={styles.cartItemControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(index, -1)}
                      >
                        <Minus size={16} color="#1976d2" />
                      </TouchableOpacity>
                      <Text style={styles.quantity}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(index, 1)}
                      >
                        <Plus size={16} color="#1976d2" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeFromCart(index)}
                      >
                        <X size={16} color="#d32f2f" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                <View style={styles.cartTotal}>
                  <Text style={styles.cartTotalText}>Total: Rs. {orderTotal}</Text>
                </View>

                {/* Payment Methods */}
                <View style={styles.paymentMethods}>
                  {['Cash', 'Esewa', 'Fonepay'].map(method => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentButton,
                        currentOrder.paymentMode === method && styles.paymentButtonActive
                      ]}
                      onPress={() => setPaymentMode(method)}
                    >
                      <Text style={[
                        styles.paymentButtonText,
                        currentOrder.paymentMode === method && styles.paymentButtonActiveText
                      ]}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.submitButton} onPress={handleSubmitOrder}>
                  <Text style={styles.submitButtonText}>Submit Order</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 16,
  },
  setupText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  setupButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  orderTabs: {
    marginBottom: 16,
  },
  orderTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderTabWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 4,
  },
  orderTabActive: {
    backgroundColor: '#1976d2',
  },
  orderTabText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  orderTabActiveText: {
    color: '#fff',
  },
  removeOrderButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  addOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
    gap: 4,
  },
  addOrderText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  categories: {
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  categoryButtonActive: {
    backgroundColor: '#1976d2',
  },
  categoryButtonText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  categoryButtonActiveText: {
    color: '#fff',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  cartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  emptyCart: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    padding: 4,
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    backgroundColor: '#ffebee',
    borderRadius: 4,
    padding: 4,
  },
  cartTotal: {
    borderTopWidth: 2,
    borderTopColor: '#1976d2',
    paddingTop: 12,
    marginTop: 12,
  },
  cartTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#1976d2',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#b3e5fc',
    alignItems: 'center',
  },
  paymentButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  paymentButtonText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  paymentButtonActiveText: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});