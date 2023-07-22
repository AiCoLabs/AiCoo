import Image from "next/image"
import opensealogo from "../public/opensealogo.png"
import { CollectionProps } from "./CollectionCards"
import Link from "next/link"

const BuyButton = (props: { data: CollectionProps }) => {
    const { data } = props
    return (
        <Link href={"/"}>
            <div className='w-16 flex justify-center items-center gap-1 bg-yellow-rgba text-black rounded-sm'>
                <Image alt='buy' src={opensealogo} width={16} height={16} />
                <div>Buy</div>
            </div>
        </Link>
    )
}

export default BuyButton