import { useContext, useState } from "react";
import { AppContext } from "../context/AppContext";
import { Item, ItemCategory, ItemType } from "../utils/models";
import useSWR from 'swr';
import { fetchAPI } from '../lib/api';
import Loader from "./Loader";
const itemCount = (items: Item[], itemId: number) => items.filter(
  ({
    attributes: {
      itemType: {
        data
      }
    }
  }) => data.id === itemId).length;

const isSoldOut = (itemType: ItemType, category: ItemCategory) => {
  if(category.attributes.overflowItem?.data?.id === itemType.id) return false;
  return category.attributes.currentQuantity >= category.attributes.maximumItemLimit;
}
const findCategory = (itemType: ItemType, categories: ItemCategory[]) =>
  categories.find(category=> itemType.attributes.itemCategory?.data?.id === category.id)
type ItemPropType = {
  category: ItemCategory;
  item: ItemType;
}

const isAtLimit = (items: Item[], itemCategory: ItemCategory) => {
  const categoryItemCount = items?.filter(item => 
    item
    .attributes.itemType.data
    .attributes.itemCategory.data
    .id === itemCategory.id
    ).length || 0;
    return categoryItemCount + 1 > itemCategory.attributes.orderItemLimit
}
const ItemList: React.FC<{translation: Record<string,string>}> = ({translation}) => {
  const [loading, setLoading] = useState(false);
  const {data: itemCategories, mutate: mutateCategories} = useSWR('/item-categories', url => fetchAPI<ItemCategory[]>(url,{},{
    populate: [
      'overflowItem',
      'itemTypes',
      'itemTypes.upgradeTarget',
      'itemTypes.upgradeTarget.itemCategory'
    ],
  }));
  const { addItem, deleteItem, items } = useContext(AppContext);
  const handleClick = async (item: ItemType) => {
    setLoading(true);
    await addItem(item);
    await mutateCategories();
    setLoading(false);
  };
  const handleDelete = async (event: any, item: ItemType) => {
    setLoading(true);
    await deleteItem(item.id);
    await mutateCategories();
    setLoading(false);
  }
  const Item = ({item, category}: ItemPropType) => (
    <div key={item.id}
    className='flex gap-2 text-center border-b-2 border-b-gray-200 mb-4 last:border-none items-center'>
      <p className='flex-1 text-slate-900'>
        {translation[item.attributes.slug]}
      </p>
      <p className='text-gray-500 flex-1'>{item.attributes.price} €</p>
      {isSoldOut(item, category) && <p>{translation.soldOut}</p>}
      <div className='flex-1 gap-4 flex items-center relative'>

        <button
          onClick={(e) => handleDelete(e,item)}
          className='btn mb-4'
          disabled={itemCount(items, item.id) === 0}
          >
          -
        </button>
        <p className='text-gray-500 mb-4'>{itemCount(items, item.id)}</p>
        <button
          disabled={isAtLimit(items,category) || isSoldOut(item,category)}
          onClick={() => handleClick(item)}
          className='btn mb-4'
          >
          +
        </button>
      </div>
    </div>
  )
  return (
    <div className="relative">
      {loading && <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center">
        <Loader/>
      </div>}
      {itemCategories?.sort((a,b) => a.id-b.id).map(category => 
        category.attributes.itemTypes.data.filter(item => {
          if(category.attributes.overflowItem?.data?.id !== item.id) return true;
          return category.attributes.currentQuantity >= category.attributes.maximumItemLimit;
        }).map(item =>
          <>
            <Item key={item.id} item={item} category={category}/>
            {item.attributes.upgradeTarget.data && itemCount(items, item.id) > 0 && 
              <Item
                item={item.attributes.upgradeTarget.data} 
                category={findCategory(item.attributes.upgradeTarget.data, itemCategories) || category} />
           }
          </>
        )
      )}
    </div>
  );
}

export default ItemList