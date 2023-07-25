import BuyButton from '@/components/BuyBtn';
import { CollectionProps, CollectionDone, collectionItem } from '@/components/CollectionCards';
import Link from 'next/link';



const collections: CollectionProps[] = new Array(12).fill(collectionItem)

const Collections = () => {
    return (
        <div className='grid grid-cols-4 gap-4 py-8'>
            {collections.map(card => (
                <Link key={card.id} href={`/Collection/${card.id}`}>
                    <CollectionDone data={card} >
                        <div className="absolute w-full bottom-0 h-11 flex items-center justify-between bg-indigo-500 px-2 text-white gap-2">
                            <div>{card.title}</div>
                            <BuyButton data={card} />
                        </div>
                    </CollectionDone>
                </Link>
            ))}
        </div>
    )
}


export default Collections 