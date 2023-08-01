import ForkNFT from "@/models/mintnft";
import { connectToDB } from "@/lib/mongodb";

export const POST = async (request) => {
    const { nftName, belongToCollectionId, nftCreator, nftOwner, forkFrom, prompt, nagativePrompt, imageUrl } = await request.json();

    try {
        await connectToDB();
        const newForkNft = new ForkNFT({ nftName, belongToCollectionId, nftCreator, nftOwner, forkFrom, prompt, nagativePrompt, imageUrl });

        await newForkNft.save();
        return new Response("create collection successful.", { status: 200 })
    } catch (error) {
        return new Response("Failed to create a new prompt", { status: 500 });
    }
}