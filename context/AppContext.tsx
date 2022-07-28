import {
  createContext, useState, useEffect, FC, useCallback, useRef
} from "react";
import { fetchAPI } from "../lib/api";
import { Customer, Item, ItemType, Order } from "../utils/models";

export interface AppContextType {
  order: Order;
  customer: Customer;
  items: Item[];
  initializeOrder: () => Promise<Order>;
  refreshFields: () => Promise<void>;
  addItem: (item: ItemType) => Promise<void>;
  deleteItem: (itemId: number) => Promise<void>;
  reset: () => void;
}
const initialCustomer =  {
  id: 0,
  attributes: {
    firstName: '',
    lastName: '',
    createdAt: '',
    email: '',
    extra: '',
    phone: '',
    postalCode: '',
    publishedAt: '',
    startYear: '',
    updatedAt: '',
    uid: '',
  }
};
const appContextDefault: AppContextType = {
  customer: initialCustomer,
  order: {
    id: 0,
    attributes: {
      createdAt: '',
      uid: '',
      publishedAt: '',
      status: 'new',
      updatedAt: '',
      transactionId: '',
      items: {
        data: []
      },
      customer: {
        data: initialCustomer
      }
    }
  },
  items: [],
  initializeOrder: () => Promise.resolve(appContextDefault.order),
  refreshFields: () => Promise.resolve(),
  addItem: () => Promise.resolve(),
  deleteItem: () => Promise.resolve(),
  reset: () => null,
};

export const AppContext = createContext<AppContextType>(appContextDefault);

type Props = {
  children: React.ReactNode
}

const AppProvider: FC<Props> = ({ children }) => {
  const [order, setOrder] = useState<Order>(appContextDefault.order);
  const [customer, setCustomer] = useState<Customer>(appContextDefault.customer);
  const [items, setItems] = useState<Item[]>(appContextDefault.items);
  const orderFetched = useRef(false);

  const reset = useCallback(() => {
    setOrder(appContextDefault.order);
    setCustomer(appContextDefault.customer);
    setItems(appContextDefault.items);
    sessionStorage.removeItem('orderUid');
  },[]);

  const initializeOrder = async () => {
    const newOrder = await fetchAPI<Order>('/orders',{
      method: 'POST',
      body: JSON.stringify({
        data: {}
      }),
    });
    setOrder(newOrder);
    sessionStorage.setItem('orderUid', String(newOrder.attributes.uid));
    const newCustomer = await fetchAPI<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          orders: [newOrder.id]
        }
      }),
    });
    setCustomer(newCustomer);
    return newOrder;
  };
  const refreshFields = useCallback(async () => {
    if(!order.attributes.uid) return;
    try {
      const newOrder = await fetchAPI<Order>(`/orders/findByUid/${order.attributes.uid}`,{},{
      });
      setOrder(newOrder);
      setCustomer(newOrder.attributes.customer.data);
      setItems(newOrder.attributes.items.data);
    } catch(error) {
      reset();
    }
  },[order.attributes.uid, reset]);

  const deleteItem = async (itemId: number) => {
    const itemToRemove = items.find(({attributes: {itemType}}) => itemType.data.id === itemId);
    if (!itemToRemove) return;
    const removeResult = await fetchAPI<Item>(`/items/${itemToRemove.id}`, {
      method: 'DELETE',
    },
    {
      orderUid: order.attributes.uid,
    });
    const filteredItems = items.filter(item => item.id !== removeResult.id);
    setItems(filteredItems);
  };

  const addItem = async (itemType: ItemType) => {
    let orderUid = order.attributes.uid;
    if (!order.id) {
      const result = await initializeOrder();
      orderUid = result.attributes.uid;
    }
    const itemCategory = itemType.attributes.itemCategory.data;
    const categoryItemCount = items.filter(item => 
      item
      .attributes.itemType.data
      .attributes.itemCategory.data
      .id === itemCategory.id
      ).length;
    if (categoryItemCount + 1 > itemCategory.attributes.orderItemLimit) {
      return;
    }
    try {
      const newItem = await fetchAPI<Item>('/items', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            itemType: itemType.id,
            order: orderUid,
          }
        }),
      });
      setItems([...items, newItem]);
    } catch(error) {
    }
  }

  useEffect(() => {
    const savedOrderUid = sessionStorage.getItem('orderUid');
    if(savedOrderUid) {
      setOrder(previousOrder => ({
        attributes: {
          ...previousOrder.attributes,
          uid: savedOrderUid,
        },
        id: previousOrder.id,
      }))
    }
  },[]);

  useEffect(() => {
    if(!orderFetched.current && order.attributes.uid) {
      refreshFields();
      orderFetched.current = true;
    }
  },[refreshFields, order.attributes.uid])
  return (
    <AppContext.Provider value={
      {
        items,
        order,
        customer,
        initializeOrder,
        refreshFields,
        addItem,
        deleteItem,
        reset,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;