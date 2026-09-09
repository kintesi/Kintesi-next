import React, { createContext, useContext, useEffect, useState } from 'react';
import { Address } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface AddressContextType {
  addresses: Address[];
  defaultAddress: Address | null;
  addAddress: (address: Omit<Address, 'id' | 'created_at'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  isLoading: boolean;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

export const AddressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load addresses on user change
  useEffect(() => {
    const loadAddresses = async () => {
      setIsLoading(true);
      try {
        let loaded: Address[] = [];
        
        if (user) {
          const { data, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false });

          if (!error && data && data.length > 0) {
            loaded = data;
          }
        }

        // Fallback local storage
        if (loaded.length === 0) {
          const key = user ? `kintesi_addresses_${user.id}` : 'kintesi_guest_addresses';
          const saved = localStorage.getItem(key);
          if (saved) {
            loaded = JSON.parse(saved);
          } else if (user) {
            // Seed a starter default address based on user profile if empty
            loaded = [
              {
                id: 'addr-' + Date.now(),
                user_id: user.id,
                label: 'Home',
                recipient_name: user.user_metadata?.full_name || 'Customer',
                phone: '01800123456',
                street_address: 'House 14, Road 5, Block C, Uttara',
                city: 'Dhaka',
                postal_code: '1230',
                is_default: true,
              },
            ];
          }
        }

        setAddresses(loaded);
      } catch (err) {
        console.warn('Address load notice:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAddresses();
  }, [user]);

  // Save to localStorage whenever addresses change
  const persistLocally = (updated: Address[]) => {
    setAddresses(updated);
    const key = user ? `kintesi_addresses_${user.id}` : 'kintesi_guest_addresses';
    localStorage.setItem(key, JSON.stringify(updated));
  };

  const addAddress = async (addressData: Omit<Address, 'id' | 'created_at'>) => {
    const newId = 'addr-' + Date.now();
    const isFirst = addresses.length === 0;
    const shouldBeDefault = addressData.is_default || isFirst;

    let updatedList = addresses;
    if (shouldBeDefault) {
      updatedList = updatedList.map((a) => ({ ...a, is_default: false }));
    }

    const newAddress: Address = {
      ...addressData,
      id: newId,
      user_id: user?.id || null,
      is_default: shouldBeDefault,
      created_at: new Date().toISOString(),
    };

    const nextAddresses = [newAddress, ...updatedList];
    persistLocally(nextAddresses);

    if (user) {
      try {
        await supabase.from('addresses').insert([newAddress]);
      } catch {}
    }
    toast.success(`Saved new address (${newAddress.label})`);
  };

  const updateAddress = async (id: string, updatedFields: Partial<Address>) => {
    let updatedList = addresses.map((a) => {
      if (a.id === id) {
        return { ...a, ...updatedFields };
      }
      if (updatedFields.is_default) {
        return { ...a, is_default: false };
      }
      return a;
    });

    persistLocally(updatedList);

    if (user) {
      try {
        await supabase.from('addresses').update(updatedFields).eq('id', id);
      } catch {}
    }
    toast.success('Address updated successfully');
  };

  const deleteAddress = async (id: string) => {
    const remaining = addresses.filter((a) => a.id !== id);
    if (remaining.length > 0 && !remaining.some((a) => a.is_default)) {
      remaining[0].is_default = true;
    }
    persistLocally(remaining);

    if (user) {
      try {
        await supabase.from('addresses').delete().eq('id', id);
      } catch {}
    }
    toast.info('Address removed from Address Book');
  };

  const setDefaultAddress = async (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      is_default: a.id === id,
    }));
    persistLocally(updated);

    if (user) {
      try {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
        await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      } catch {}
    }
    toast.success('Set as primary delivery address');
  };

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0] || null;

  return (
    <AddressContext.Provider
      value={{
        addresses,
        defaultAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        isLoading,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = () => {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};
