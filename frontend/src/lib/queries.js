import { supabase } from './supabase';

export const productQueries = {
  // Products
  getProducts: async (limit = 200) => {
    return await supabase
      .from('products')
      .select('*, category:categories(name), images:product_images(url)')
      .limit(limit);
  },
  getProductById: async (id) => {
    return await supabase
      .from('products')
      .select('*, category:categories(name), images:product_images(url)')
      .eq('id', id)
      .single();
  },
  createProduct: async (product) => {
    return await supabase.from('products').insert([product]);
  },
  updateProduct: async (id, data) => {
    return await supabase.from('products').update(data).eq('id', id);
  },
  deleteProduct: async (id) => {
    return await supabase.from('products').delete().eq('id', id);
  }
};

export const orderQueries = {
  // Orders
  getOrders: async () => {
    return await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
  },
  getOrderById: async (id) => {
    return await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
  },
  updateOrderStatus: async (id, status) => {
    return await supabase.from('orders').update({ payment_status: status }).eq('id', id);
  }
};

export const categoryQueries = {
  // Categories
  getCategories: async () => {
    return await supabase.from('categories').select('*');
  },
  createCategory: async (name) => {
    return await supabase.from('categories').insert([{ name }]);
  },
  deleteCategory: async (id) => {
    return await supabase.from('categories').delete().eq('id', id);
  }
};

export const userQueries = {
  // Users (Assuming admin user fetching, requires RLS policies or Service Role for arbitrary fetching)
  getUsers: async () => {
    return await supabase.from('profiles').select('*');
  }
};
