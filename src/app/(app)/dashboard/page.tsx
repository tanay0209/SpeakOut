'use client'

import MessageCard from "@/components/MessageCard"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Message } from "@/model/User"
import { acceptMessageSchema } from "@/schemas/acceptMessageSchema"
import { ApiResponse } from "@/types/ApiResponse"
import { zodResolver } from "@hookform/resolvers/zod"
import axios, { AxiosError } from "axios"
import { Loader2, RefreshCcw } from "lucide-react"
import { User } from "next-auth"
import { useSession } from "next-auth/react"
import { ApiError } from "next/dist/server/api-utils"
import { useCallback, useEffect, useState } from "react"
import { useForm } from "react-hook-form"

function page() {
    const [messages, setMessages] = useState<Message[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSwitchLoading, setIsSwitchLoading] = useState(false)
    const { data: session } = useSession()
    const { toast } = useToast()
    const { register, setValue, watch } = useForm({
        resolver: zodResolver(acceptMessageSchema)
    })
    const acceptMessages = watch('acceptMessages')

    const handleDeleteMessages = (messageId: string) => {
        setMessages(messages.filter(message => message._id !== messageId))
    }

    const fetchAcceptMessage = useCallback(async () => {
        setIsSwitchLoading(true)
        try {
            const reponse = await axios.get<ApiResponse>('/api/accept-messages')
            setValue('acceptMessages', reponse.data.isAcceptingMessages)
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>
            toast({
                title: "Error",
                description: axiosError.response?.data.message || "Failed to retreive message settings",
                variant: "destructive"
            })
        } finally {
            setIsSwitchLoading(false)
        }
    }, [setValue])

    const fetchMessages = useCallback(async (refresh: boolean = false) => {
        setIsLoading(true)
        setIsSwitchLoading(true)
        try {
            const response = await axios.get<ApiResponse>('/api/get-messages')
            setMessages(response.data.messages || [])
            if (refresh) {
                toast({
                    title: "Refreshed Messages",
                    description: "Showing Latest Messages"
                })
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>
            toast({
                title: "Error",
                description: axiosError.response?.data.message || "Failed to retreive messages",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
            setIsSwitchLoading(false)
        }
    }, [setIsLoading, setMessages])

    useEffect(() => {
        if (!session || !session.user) return
        fetchMessages()
        fetchAcceptMessage()
    }, [session, setValue, fetchAcceptMessage, fetchMessages])

    const handleSwitchChange = async () => {
        try {
            const response = await axios.post<ApiResponse>('/api/accept-messages', {
                acceptMessages: !acceptMessages
            })
            setValue("acceptMessages", !acceptMessages)
            toast({
                title: response.data.message
            })
        } catch (error) {
            const axiosError = error as AxiosError<ApiError>
            toast({
                title: "Error",
                description: axiosError.response?.data.message || "Failed to change message status",
                variant: "destructive"
            })
        }
    }
    const { username } = session?.user as User
    const baseUrl = `${window.location.protocol}//${window.location.host}`
    const profileUrl = `${baseUrl}/u/${username}`

    const copyToClipboard = () => {
        navigator.clipboard.writeText(profileUrl)
        toast({
            title: "Copied Successfully",
            description: "Profile link copied to clipboard"
        })
    }


    if (!session || !session.user) {
        return <div>Please Login</div>
    }


    return (
        <div
            className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rouned w-full max-w-6xl"
        >
            <h1 className="text-4xl font-bold mb-4">User Dashboard</h1>
            <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">Copy your unique link</h2>
                <div className="flex items-center">
                    <input
                        type="text"
                        value={profileUrl}
                        disabled
                        className="input input-bordered w-full p-2 mr-2"
                    />
                    <Button onClick={copyToClipboard}>Copy</Button>
                </div>
            </div>
            <div className="mb-4">
                <Switch
                    {...register('acceptMessages')}
                    checked={acceptMessages}
                    onCheckedChange={handleSwitchChange}
                    disabled={isSwitchLoading}
                />
                <span className="ml-2">
                    Accept Messages: {acceptMessages ? 'On' : 'Off'}
                </span>
            </div>
            <Separator />

            <Button
                className="mt-4"
                variant='outline'
                onClick={(e) => {
                    e.preventDefault()
                    fetchMessages(true)
                }}
            >
                {isLoading ? (
                    <Loader2
                        className="h-4 w-4 animate-spin"
                    />)
                    : (
                        <RefreshCcw className="w-4 h-4" />)
                }
            </Button>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {messages.length > 0 ?
                    (messages.map((message, index) => {
                        return <MessageCard
                            key={message._id}
                            message={message}
                            onMessageDelete={handleDeleteMessages}
                        />
                    }))
                    : (
                        <p>No Message to display</p>
                    )
                }
            </div>
        </div>
    )
}

export default page