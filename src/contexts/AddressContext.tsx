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

          if (loaded.length === 0) {
            const key = `kintesi_addresses_${user.id}`;
            const saved = localStorage.getItem(key);
            if (saved) {
              try {
                const parsed: Address[] = JSON.parse(saved);
                loaded = parsed.filter(
                  (a) =>
                    a &&
                    !a.phone?.includes('01800123456') &&
                    !a.street_address?.includes('House 14, Road 5')
                );
              } catch {
                loaded = [];
              }
            }
          }
        } else {
          // Without an account, Address Book is empty and inactive
          loaded = [];
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

  // Save to localStorage whenever addresses change (only for logged-in users)
  const persistLocally = (updated: Address[]) => {
    setAddresses(updated);
    if (user) {
      const key = `kintesi_addresses_${user.id}`;
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  const addAddress = async (addressData: Omit<Address, 'id' | 'created_at'>) => {
    if (!user) {
      toast.error('An account is required to save an address to your Address Book. Please sign in or register.');
      return;
    }

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
      user_id: user.id,
      is_default: shouldBeDefault,
      created_at: new Date().toISOString(),
    };

    const nextAddresses = [newAddress, ...updatedList];
    persistLocally(nextAddresses);

    try {
      await supabase.from('addresses').insert([newAddress]);
    } catch {}
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
