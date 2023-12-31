"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast, useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import Upload from "@/components/Upload";
import Image from "next/image";
import { collectionItem } from "@/components/CollectionCards";

import { base64toBuff, cn, dataURLtoBlob, trimify } from "@/lib/utils";
import {
  AICOO_PROXY_ADDRESS,
  AICOO_WEBSITE,
  DiffusionModel,
  DiffusionStyle,
  IPFS_GATEWAY_URL,
} from "@/lib/constants";
import { requestImageToImage, requestTextToImage } from "@/lib/openAPI";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useContractWrite } from "wagmi";
import { AI_COO_ABI } from "@/abis/AiCooProxy";
import { storeBlob, storeCar } from "@/lib/uploadToStorage";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { postReq } from "@/api/server/abstract";
import { getNFTCreateds } from "@/api/mongodbApi";
import { TextToImageRequestBody } from "@/lib/DiffusionOpenAPI";

const NFTbaseFormSchema = z.object({
  prompt: z.string(),
  nPrompt: z.string().optional(),
  image: z.any().optional(),
  count: z.array(z.number().min(1).max(4)).optional(),
  advanced: z.boolean().optional(),
  width: z.number().min(200).max(1000).optional(),
  height: z.number().min(200).max(1000).optional(),
  steps: z.number().min(1).max(10).optional(),
  model: z.string(),
  style: z.string(),
});

type NFTbaseFormValues = z.infer<typeof NFTbaseFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<NFTbaseFormValues> = {
  // name: "",
  // endTime: new Date("2023-01-23"),
};

interface BaseFormProps {
  // this form component is used by below 3 pages
  type: "TextToImage" | "ImageToImage" | "ForkImage";
  collectionId: string;
  nftId?: string;
  fromImageId?: string;
  className?: string;
}

export default function NFTbaseForm(props: BaseFormProps) {
  const abiCoder = new ethers.AbiCoder();
  const { type, collectionId, nftId, fromImageId, className } = props;
  const [imageURL, setImageURL] = useState<string[] | undefined>(undefined);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [selectIndex, setSelectIndex] = useState(-1);
  const gallaryRef = useRef<HTMLDivElement>(null);

  const [buttonState, setButtonState] = useState({
    buttonText: "Upload",
    loading: false,
  });
  const router = useRouter();
  const form = useForm<NFTbaseFormValues>({
    resolver: zodResolver(NFTbaseFormSchema),
    defaultValues,
  });
  const account = useAccount({
    onConnect: (data) => console.log("connected", data),
    onDisconnect: () => console.log("disconnected"),
  });
  const [imageSource, setImageSource] = useState<string | undefined>();
  const [orignalNFT, setOrignalNFT] = useState<
    { prompt: string; nprompt: string } | undefined
  >();
  const [prompt, setPrompt] = useState("");
  const [nprompt, setNPrompt] = useState<string | undefined>();
  const [advanced, count] = form.watch(["advanced", "count"]);

  useEffect(() => {
    if (nftId) {
      getNFTCreateds({
        belongToCollectionId: collectionId,
        tokenId: nftId,
      }).then((res) => {
        const orignalNFT = res?.[0];
        setOrignalNFT(orignalNFT);
        form.setValue("prompt", orignalNFT.prompt);
        form.setValue("nPrompt", orignalNFT.nPrompt);
      });
    }
  }, [collectionId, nftId]);

  const generate = useCallback(
    async (data: NFTbaseFormValues) => {
      setSelectIndex(-1);
      setGenerating(true);
      setError(undefined);
      let res: [string[] | undefined, Error | undefined] | null = null;
      if (type === "TextToImage" || type === "ForkImage") {
        res = await requestTextToImage({
          engineID: data.model,
          positivePrompt: data.prompt,
          samples: count ? count[0] : 1,
          style: data.style as TextToImageRequestBody["style_preset"],
          negativePrompt: data.nPrompt,
          height: data.height,
          width: data.width,
          steps: data.steps,
        });
      } else if (type === "ImageToImage" && data.image) {
        res = await requestImageToImage(
          data.model,
          data.prompt,
          data.image,
          count ? count[0] : 1,
          data.nPrompt,
          data.steps
        );
      }
      console.log("generate", res);
      if (res) {
        setPrompt(data.prompt);
        setNPrompt(data.nPrompt);
        const [url, error] = res;
        setGenerating(false);
        if (error) {
          setError(error.message);
          setImageURL(undefined);
        } else {
          setImageURL(url);
        }
      }
    },
    [type]
  );

  function onSubmit(data: NFTbaseFormValues) {
    console.log("onSubmit", data);
    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
    generate(data);
  }

  const { write: writePostContract } = useContractWrite({
    address: AICOO_PROXY_ADDRESS,
    abi: AI_COO_ABI,
    functionName: "commitNewNFTIntoCollection",
    onSuccess: async (data) => {
      console.log("onSuccess data", data);
      await postReq({
        url: "/api/nft/fork",
        data: {
          nftName: "",
          belongToCollectionId: collectionId,
          nftCreator: account?.address,
          nftOwner: account?.address,
          forkFrom: nftId || 0,
          prompt: prompt,
          nagativePrompt: nprompt,
          imageUrl: imageSource,
        },
      });
      setButtonState({
        buttonText: `Upload`,
        loading: false,
      });
      router.push(`/Collection/${collectionId}`);
    },
    onError: (error) => {
      console.log("onError error", error);
      setButtonState({
        buttonText: `Upload`,
        loading: false,
      });
    },
  });

  const createNFT = async (imageSource: string) => {
    try {
      setButtonState({
        buttonText: `Storing metadata`,
        loading: true,
      });
      const attributes = [];
      const metadata = {
        external_link: `${AICOO_WEBSITE}`,
        image: imageSource,
        attributes,
      };
      console.log("metadata", metadata);
      let metadataUri = await storeBlob(JSON.stringify(metadata));
      metadataUri = "ipfs://" + metadataUri;
      console.log("metadataUri", metadataUri);
      setButtonState({
        buttonText: `Posting image`,
        loading: true,
      });
      //let mintInfo = await getNewCollectionMintInfo(id)
      // uint256 collectionId;
      // string nftInfoURI;
      // uint256 derivedFrom;
      // bytes derivedModuleData;
      // bytes32[] proof;

      const args = [
        props.collectionId,
        metadataUri,
        nftId || 0,
        abiCoder.encode(["bool"], [false]),
        [],
      ];
      console.log("writePostContract args", args);
      return writePostContract?.({ args: [args] });
    } catch (e) {
      console.error("e", e);
      setButtonState({
        buttonText: `Post image`,
        loading: false,
      });
    }
  };

  const uploadImageToIpfs = async () => {
    if (imageURL?.[selectIndex]) {
      setButtonState({
        buttonText: `Uploading to IPFS`,
        loading: true,
      });
      const result = await storeCar(dataURLtoBlob(imageURL[selectIndex]));
      const url = "ipfs://" + result;
      setImageSource(url);
      return await createNFT(url);
    }
  };

  const uploadToContract = () => {
    if (selectIndex === -1) {
      return;
    }
    uploadImageToIpfs();
  };

  // when generator new image,set gallary scrollIntoView
  useEffect(() => {
    if (imageURL) {
      window.timer = window.setTimeout(() => {
        gallaryRef?.current?.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "smooth",
        });
      }, 100);
    }
    return () => {
      window.clearTimeout(window.timer);
    };
  }, [imageURL]);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn("space-y-8 bg-indigo-500 p-3 rounded-2xl", className)}
        >
          {type === "ForkImage" && fromImageId && (
            <div>
              <FormLabel>Fork From( #{nftId})</FormLabel>
              <img
                src={`${IPFS_GATEWAY_URL}/${fromImageId}`}
                alt="nft"
                className="w-40 h-40 mx-auto mt-2"
              />
              {/* <FormLabel>{`Orignal Prompt:`}</FormLabel>
              <FormDescription>{orignalNFT?.prompt}</FormDescription>
              <FormLabel>{`Orignal Negative prompt:`}</FormLabel>
              <FormDescription>{orignalNFT?.nprompt}</FormDescription> */}
            </div>
          )}

          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nPrompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Negative prompt</FormLabel>
                <FormControl>
                  <Textarea {...field} required={false} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {type === "ImageToImage" && (
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Image</FormLabel>
                  <FormControl>
                    <Upload {...field} />
                  </FormControl>
                  <FormDescription>Upload Image</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {/* <FormField
            control={form.control}
            name="count"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex justify-between">
                  Image Count <span>{count ? count[0] : 1}</span>
                </FormLabel>
                <FormControl>
                  <Slider
                    defaultValue={[1]}
                    max={4}
                    step={1}
                    min={1}
                    {...field}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          /> */}

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model to generate" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DiffusionModel.map((item, index) => {
                      return (
                        <SelectItem value={item.value} key={index}>
                          {item.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="style"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Style</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a style to generate" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DiffusionStyle.map((item, index) => {
                      return (
                        <SelectItem value={item.value} key={index}>
                          {item.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="advanced"
            render={({ field }) => (
              <FormItem className="flex gap-4 items-center space-y-0">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Advanced</FormLabel>
              </FormItem>
            )}
          />
          {advanced && (
            <>
              {type === "TextToImage" && (
                <div className="flex gap-8">
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Width</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              <div className="flex gap-8">
                <FormField
                  control={form.control}
                  name="steps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Generation steps</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </>
          )}
          <Button type="submit" disabled={generating}>
            Generate
          </Button>
        </form>
      </Form>
      {imageURL && (
        <div ref={gallaryRef}>
          <div className="grid grid-cols-2 justify-items-center gap-4 p-4 mt-8 border">
            {imageURL.map((image, index) => {
              return (
                <div
                  className={cn("w-[24rem] h-[24rem] relative")}
                  key={index}
                  onClick={() => setSelectIndex(index)}
                >
                  <Image src={image} alt="card" fill />
                  {selectIndex === index && (
                    <div
                      className="absolute rounded-2xl "
                      style={{
                        left: "-10px",
                        right: "-10px",
                        bottom: "-10px",
                        top: "-10px",
                        border: "1px solid",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Button
            className="mt-8"
            onClick={uploadToContract}
            disabled={selectIndex === -1}
          >
            {buttonState.buttonText}
          </Button>
        </div>
      )}
    </>
  );
}
