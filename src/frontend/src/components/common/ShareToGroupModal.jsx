import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Users, Send, Loader2, Image, Video } from "lucide-react";
import { userApi } from "../../api/userApi";
import { communicationApi } from "../../api/communicationApi";

const DEFAULT_GROUP_AVATAR = "https://res.cloudinary.com/derwtva4p/image/upload/v1765458810/file-service/fffsss.png";

export default function ShareToGroupModal({
    isOpen,
    onClose,
    mediaUrl,
    isVideo = false,
    prompt = "",
}) {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    // Fetch user's joined groups
    const fetchMyGroups = useCallback(async () => {
        setLoading(true);
        try {
            const response = await userApi.getMyGroups(1, 50);
            let groupIds = [];
            const result = response?.data?.result;

            if (Array.isArray(result?.items)) {
                groupIds = result.items.map(item => typeof item === 'string' ? item : item.groupId);
            } else if (Array.isArray(result)) {
                groupIds = result.map(item => typeof item === 'string' ? item : item.groupId);
            }

            if (groupIds.length === 0) {
                setGroups([]);
                setLoading(false);
                return;
            }

            // Fetch details for each group
            const groupDetailsPromises = groupIds.map(async (groupId) => {
                try {
                    const detailRes = await communicationApi.getGroupDetail(groupId);
                    return detailRes?.data?.result || null;
                } catch (err) {
                    console.error(`Failed to fetch group ${groupId}:`, err);
                    return null;
                }
            });

            const groupDetails = await Promise.all(groupDetailsPromises);
            const formattedGroups = groupDetails
                .filter(group => group !== null)
                .map((group) => ({
                    id: group.groupId || group.id,
                    groupId: group.groupId || group.id,
                    name: group.name || "Group",
                    avatar: group.image || DEFAULT_GROUP_AVATAR,
                    memberCount: group.memberIds?.length || 0,
                }));

            setGroups(formattedGroups);
        } catch (error) {
            console.error("Failed to fetch groups:", error);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchMyGroups();
            setSelectedGroup(null);
            setMessage(prompt ? `Prompt: ${prompt}` : "");
        }
    }, [isOpen, fetchMyGroups, prompt]);

    const handleSend = () => {
        if (!selectedGroup || !mediaUrl) return;

        setSending(true);

        // Navigate to MessagesPage with share data
        navigate("/messages", {
            state: {
                shareToGroup: {
                    groupId: selectedGroup.groupId,
                    mediaUrl: mediaUrl,
                    isVideo: isVideo,
                    message: message.trim(),
                }
            }
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-500" />
                            Send to Group
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Media Preview */}
                    <div className="px-5 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                {isVideo ? (
                                    <video src={mediaUrl} className="w-full h-full object-cover" muted />
                                ) : (
                                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    {isVideo ? (
                                        <><Video className="w-4 h-4" /> Video AI</>
                                    ) : (
                                        <><Image className="w-4 h-4" /> AI Image</>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Add a message (optional)..."
                                    className="w-full mt-1 text-sm border-0 p-0 focus:ring-0 focus:outline-none text-gray-800 placeholder-gray-400"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Groups List */}
                    <div className="flex-1 overflow-y-auto p-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 text-sm">
                                You haven't joined any groups yet.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {groups.map((group) => (
                                    <button
                                        key={group.groupId}
                                        type="button"
                                        onClick={() => setSelectedGroup(group)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${selectedGroup?.groupId === group.groupId
                                            ? "bg-purple-50 border-2 border-purple-500"
                                            : "hover:bg-gray-50 border-2 border-transparent"
                                            }`}
                                    >
                                        <img
                                            src={group.avatar}
                                            alt={group.name}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-gray-900">{group.name}</p>
                                            <p className="text-xs text-gray-500">{group.memberCount} members</p>
                                        </div>
                                        {selectedGroup?.groupId === group.groupId && (
                                            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!selectedGroup || sending}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send to Group
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
