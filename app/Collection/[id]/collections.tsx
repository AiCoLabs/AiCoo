import BuyButton from '@/components/BuyBtn';
import ForkButton from '@/components/ForkBtn';
import { CollectionProps, CollectionDone, collectionItem } from '@/components/CollectionCards';



const collections: CollectionProps[] = new Array(12).fill(collectionItem)

const Collections = () => {
    return (
        <div className='grid grid-cols-4 gap-4 py-8'>
            {collections.map(card => (
                <CollectionDone data={card} >
                    <div className="absolute w-full bottom-0 h-11 flex items-center justify-between bg-indigo-500 px-2 gap-2 text-white">
                        <div>{card.title}</div>
                        <ForkButton data={card} />
                        <BuyButton data={card} />
                    </div>
                </CollectionDone>
            ))}
        </div>
    )
}


export default Collections 