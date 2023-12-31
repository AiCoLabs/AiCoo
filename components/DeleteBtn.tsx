"use client";
import { NewNFTCreateds } from "@/lib/type";
import { Trash2Icon } from "lucide-react";
import { useAccount, useContractWrite } from "wagmi";
import { AI_COO_ABI } from "@/abis/AiCooProxy";
import { AICOO_PROXY_ADDRESS } from "@/lib/constants";
//Only the person who created the collection has permission to delete it.
// Additionally, an NFT can only be deleted if it was created within the last 7 days

const isShowDeleteButton = (data: NewNFTCreateds) => {
  const currentSecondValue = Math.floor(Date.now() / 1000);
  const nftCreateTime = data.blockTimestamp;
  const diff = currentSecondValue - Number(nftCreateTime);
  return diff < 7 * 24 * 60 * 60;
};

const DeleteButton = (props: { data: NewNFTCreateds; owner?: string }) => {
  const { data, owner } = props;
  const account = useAccount({
    onConnect: (data) => console.log("connected", data),
    onDisconnect: () => console.log("disconnected"),
  });
  const { write: writePostContract } = useContractWrite({
    address: AICOO_PROXY_ADDRESS,
    abi: AI_COO_ABI,
    functionName: "limitBurnTokenByCollectionOwner",
    onSuccess: (data) => {
      console.log("onSuccess data", data);
    },
    onError: (error) => {
      console.log("onError error", error);
    },
  });
  const deleteNFT = () => {
    console.log("deleteNFT", data.collectionId, data.tokenId);
    writePostContract?.({ args: [[data.collectionId, data.tokenId]] });
  };
  // console.log("owner",owner);

  if (account.address?.toLocaleLowerCase() !== owner?.toLocaleLowerCase() || !isShowDeleteButton(data)||data.tokenId==="0") {
    return false;
  }
  return (
    <div
      className="p-[2px] flex justify-center items-center gap-1 deleteBtn-bg text-white rounded-sm"
      onClick={deleteNFT}
    >
      <Trash2Icon className="w-4 h-4" />
      {/* <div>Delete</div> */}
    </div>
  );
};

export default DeleteButton;
