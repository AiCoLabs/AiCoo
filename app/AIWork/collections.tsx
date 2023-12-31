'use client'
import { getNewCollectionCreated } from '@/api/thegraphApi';
import BuyButton from '@/components/BuyBtn';
import { CollectionDone, collectionItem } from '@/components/CollectionCards';
import { NewCollectionCreateds } from '@/lib/type';
import Link from 'next/link';
import { useEffect, useState } from 'react';


const Collections = () => {
    const [collections, setCollections] = useState<NewCollectionCreateds[]>([])
    useEffect(()=>{
        getNewCollectionCreated().then(res=>{
            setCollections(res as NewCollectionCreateds[])
        })
    }, [])
    return (
        <div className='grid grid-cols-4 gap-4 py-8'>
            {collections?.map(card => (
                <Link key={card.id} href={`/Collection/${card?.collectionId}`}>
                    <CollectionDone sampleData={card} >
                        <div className="absolute w-full bottom-0 h-11 flex items-center justify-between bg-indigo-500 px-2 text-white gap-2">
                            <div>{card.detailJson.name}</div>
                            <BuyButton data={card as any} />
                        </div>
                    </CollectionDone>
                </Link>
            ))}
        </div>
    )
}


export default Collections 