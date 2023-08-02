'use client'
import {
  BsDiscord,
  BsMedium,
  BsTwitter,
  BsTelegram,
  BsPlusLg,
} from "react-icons/bs";

import UserAvatar from "@/components/UserAvatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CollectionCards from "./collections";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NewCollectionCreateds, NewNFTCreateds, CollectionMintInfo } from "@/lib/type";
import { getNewNFTCreatedByCollectionId, getNewNFTCreateds, getNewCollectionMintInfo } from "@/api/thegraphApi";
import { categorys } from "../Create/components/FormInfo";
import { format } from "date-fns";
import { DERIVED_NFT_ABI } from "@/abis/AiCooProxy";
import { Address, sepolia, useAccount, useBalance, useContractRead, useContractWrite } from "wagmi";
import { bignumberPlus, toAmount } from "@/lib/utils";

const Collection = ({ params }: { params: { id: string } }) => {
  const [collectionItem, setCollectionItem] = useState<NewCollectionCreateds|undefined>()
  const [collectionInfo, setCollectionInfo] = useState<CollectionMintInfo|undefined>()
  const [nfts, setNFTs] = useState<NewNFTCreateds[]|undefined>()
  useEffect(()=>{
    getNewNFTCreatedByCollectionId(params.id).then((res)=>setCollectionItem(res))
    getNewCollectionMintInfo(params.id).then((res)=>setCollectionInfo(res))
    getNewNFTCreateds(params.id).then((res)=>{
      console.log('res', res)
      setNFTs(res)
    })
  },[])

  const account = useAccount({
    onConnect: (data) => console.log('connected', data),
    onDisconnect: () => console.log('disconnected'),
  })

  const {data: totalReleased} = useContractRead({
    address: collectionItem?.derivedCollectionAddr as Address,
    abi: DERIVED_NFT_ABI,
    functionName: 'totalReleased'
  })
  
  const { data: collectionBalance } = useBalance({
    address: collectionItem?.derivedCollectionAddr as Address,
    chainId: sepolia.id,
    watch: true
  })

  // const {data: releasable} = useContractRead({
  //   address: collectionItem?.derivedCollectionAddr as Address,
  //   abi: DERIVED_NFT_ABI,
  //   functionName: 'releasable',
  //   args: [account?.address || '']
  // })

  const { write: claimFromContract } = useContractWrite({
    address: collectionItem?.derivedCollectionAddr as Address,
    abi: DERIVED_NFT_ABI,
    functionName: 'release',
    onSuccess: (data) => {
      console.log('onSuccess data', data)
    },
    onError: (error) => {
      console.log('onError error', error)
    }
  })

  const claimRelease = ()=>{
    console.log('claimRelease')
    claimFromContract({args: [account?.address]})
  }

  return (
    <div className="container mx-auto">
      <img
        src={collectionItem?.detailJson.image}
        alt=""
        style={{objectFit: 'cover'}}
        className="w-full h-56 -mb-32"
      />
      <div className="px-10 ">
        <img
          src={collectionItem?.detailJson.image}
          alt=""
          className="w-40 h-40"
        />
        <div className="grid grid-cols-3 gap-14 text-lg text-white">
          <div className="col-span-2">
            <div className="flex justify-between items-center mt-4">
              <div className="text-2xl font-medium">
                {collectionItem?.detailJson.name}
              </div>
              <div className="flex justify-between gap-2">
                <BsTwitter />
                <BsTelegram />
                <BsMedium />
                <BsDiscord />
              </div>
            </div>
            <div className="flex gap-2 items-center mt-4">
              <div>By</div>
              {collectionItem && <UserAvatar created={collectionItem} />}
            </div>
            <div className="flex gap-6 mt-4">
              <div className="flex gap-2 items-center">
                <div className="text-white-rgba">Creators</div>
                <div>851</div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-white-rgba">Items </div>
                <div>5.3K</div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-white-rgba">Community earnings</div>
                <div>{`${(collectionItem?.baseRoyalty ?? 0) / 100} %`}</div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="text-white-rgba">Category </div>
                <div>
                  {
                    categorys.find(
                      (category) =>
                        category.value === collectionItem?.collectionType
                    )?.label
                  }
                </div>
              </div>
            </div>
            <div className="mt-4">{collectionItem?.detailJson.description}</div>
            {/* <div className="mt-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-white-rgba">
                    See more
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes. It adheres to the WAI-ARIA design pattern.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div> */}
            <div className="bg-indigo-500 py-4 px-2">
              <div className="flex gap-6">
                <div className="flex gap-2 items-center">
                  <div className="text-white-rgba">Total Royalty: </div>
                  <div>{`${bignumberPlus(totalReleased || 0, collectionBalance?.value || 0, 18)} ETH`}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="text-white-rgba">Royalty Balance: </div>
                  <div>{`${toAmount(collectionBalance?.value || 0, 18)} ETH`}</div>
                </div>
              </div>
              <div className="flex gap-6 mt-4">
                <div className="flex gap-2 items-center">
                  <div className="text-white-rgba"> Your Share: </div>
                  <div>{`0 ETH`}</div>
                </div>
                <div className="bg-indigo-800 p-1 rounded-sm" onClick={claimRelease}>Claim</div>
              </div>
            </div>
          </div>
          <div className="col-span-1">
            <div className="text-2xl font-medium text-white-rgba">Rule</div>
            <div className="flex gap-4 mt-4">
              <div className="text-white-rgba">Mint Limit: </div>
              <div>{collectionInfo?.mintLimit}</div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="text-white-rgba">End Time: </div>
              <div>
                {collectionInfo?.mintExpired
                  ? format(collectionInfo?.mintExpired*1000, "PPP")
                  : ""}
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="text-white-rgba">Mint Price: </div>
              <div>{collectionInfo?.mintPrice}</div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="text-white-rgba">Permission: </div>
              <div>Public</div>
            </div>
            <div className="flex gap-4 mt-4">
              <div className="text-white-rgba">Rights: </div>
              <div>
                To protect the quality of collection,Collection owner have
                rights to refund(gas not include) and delete any item within 7
                days after minted.
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b-2 border-[#D9D9D9] mt-7"></div>
      <div className="flex w-full max-w-sm items-center space-x-2 mt-3">
        <Input
          type="text"
          placeholder="Search by name"
          className="text-white"
        />
        <Button type="submit" className="bg-indigo-800">
          Search
        </Button>
      </div>
      {!nfts || nfts?.length === 0 ? (
        <Link
          href={`/NFT/Create/${params.id}`}
          className={
            "flex flex-col items-center justify-center w-[15.18125rem] mt-4 h-[18.75rem] border text-white"
          }
        >
          <BsPlusLg className="w-36 h-36" />
          Initail Ancestor NFT
        </Link>
      ) : (
        <CollectionCards data={nfts} collectionItem={collectionItem} className="mt-4" />
      )}
    </div>
  );
};

export default Collection;
