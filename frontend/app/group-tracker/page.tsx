"use client";

import { useState, useEffect, useRef, useId, startTransition, useCallback } from "react";
import {
  Users,
  UserPlus,
  Send,
  MapPin,
  Copy,
  Check,
  QrCode,
  Bell,
  Share2,
  Crown,
  UserCheck,
  Sparkles,
  LogOut,
  Radio,
  Clock,
  MessageSquare,
  ShieldCheck,
  Compass
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/utils/supabase/client";
import { useTranslation } from "@/lib/i18n";
import dynamic from "next/dynamic";
const supabase = createClient();

// Dynamic import for Leaflet map component (SSRs safely)
const GroupMapComponent = dynamic(() => import("@/components/GroupMapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full bg-orange-50/60 dark:bg-slate-800 rounded-3xl animate-pulse flex flex-col items-center justify-center text-slate-500 border border-orange-200/50">
      <Compass className="h-8 w-8 text-orange-400 animate-spin mb-2" />
      <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
        Loading Interactive Nashik Map...
      </span>
    </div>
  )
});

type Role = "none" | "coordinator" | "member";

interface Member {
  id: string;
  name: string;
  role: "coordinator" | "member";
  lat?: number;
  lng?: number;
  lastUpdated?: string;
  note?: string;
}

interface Note {
  id: string;
  senderName: string;
  senderRole: "coordinator" | "member";
  message: string;
  timestamp: string;
}

type GroupBroadcastPayload = {
  member?: Member;
  note?: Note;
  location?: { memberId: string; lat: number; lng: number; lastUpdated: string };
};

const STORAGE_KEYS = {
  ACTIVE_CODE: "active_group_code",
  ACTIVE_USER_NAME: "group_user_name",
  ACTIVE_ROLE: "group_user_role",
  ACTIVE_USER_ID: "group_user_id",
  NOTES: (code: string) => `group_notes_v2_${code}`,
  MEMBERS: (code: string) => `group_members_v2_${code}`,
  LOCATIONS: (code: string) => `group_locations_v2_${code}`,
  COORDINATOR: (code: string) => `group_coordinator_v2_${code}`,
};

const PRESET_MESSAGES = [
  "I am near Ramkund 🌊",
  "Meet at Gate 2 📍",
  "I reached the parking area 🅿️",
  "Taking a quick tea break ☕",
  "Near Trimbakeshwar Mandir 🛕",
  "Need assistance / call me 📞"
];

export default function GroupTracker() {
  const instanceId = useId();
  const { t } = useTranslation();

  // State
  const [role, setRole] = useState<Role>("none");
  const [groupCode, setGroupCode] = useState("");
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [createGroupTitle, setCreateGroupTitle] = useState("Nashik Yatra Group");
  
  const [coordinatorName, setCoordinatorName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [syncError, setSyncError] = useState("");
  const [joinNotice, setJoinNotice] = useState("");

  const [noteInput, setNoteInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // References for subscriptions & polling
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const syncGroupRequest = useCallback(async (path: string, body: Record<string, unknown>) => {
    const { data } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
    const response = await fetch(`/api/group-sync${path}`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Group synchronization failed");
    return payload;
  }, []);

  const syncExistingGroup = useCallback(async (code: string, roster: Member[]) => {
    await syncGroupRequest("/groups", {
      groupCode: code,
      groupName: createGroupTitle,
      reconcileOnly: true,
    });
    return syncGroupRequest(`/groups/${encodeURIComponent(code)}/sync`, {
      currentMemberId: userId,
      members: roster,
    });
  }, [createGroupTitle, syncGroupRequest, userId]);

  const reconcileGroup = useCallback(async (code: string) => {
    const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS(code));
    let roster: Member[] = [];
    if (storedMembers) {
      try {
        roster = JSON.parse(storedMembers) as Member[];
      } catch {
        roster = [];
      }
    }
    const data = await syncExistingGroup(code, roster);
    const currentById = new Map(roster.map((member) => [member.id, member]));
    const synchronized = (data.members || []).map((member: Member) => ({
      ...currentById.get(member.id),
      ...member,
    }));
    setMembers(synchronized);
    localStorage.setItem(STORAGE_KEYS.MEMBERS(code), JSON.stringify(synchronized));
    setSyncError("");
  }, [syncExistingGroup]);

  // Load group details, notes, members from persistence layer
  const loadGroupData = (code: string) => {
    const storedCoord = localStorage.getItem(STORAGE_KEYS.COORDINATOR(code));
    if (storedCoord) setCoordinatorName(storedCoord);

    const storedNotes = localStorage.getItem(STORAGE_KEYS.NOTES(code));
    if (storedNotes) {
      try {
        setNotes(JSON.parse(storedNotes));
      } catch {}
    }

    const storedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS(code));
    if (storedMembers) {
      try {
        setMembers(JSON.parse(storedMembers));
      } catch {}
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
        const metaName = data.session.user.user_metadata?.full_name || data.session.user.email?.split("@")[0];
        if (metaName && !userName) {
          setUserName(metaName);
        }
      } else {
        const savedUserId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID) || `user_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, savedUserId);
        setUserId(savedUserId);
      }
    });

    const savedCode = localStorage.getItem(STORAGE_KEYS.ACTIVE_CODE);
    const savedRole = (localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE) as Role) || "none";
    const savedName = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_NAME) || "";
    const linkedGroupCode = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase();

    startTransition(() => {
      if (savedName) setUserName(savedName);
      if (linkedGroupCode && /^[A-Z0-9]{3,12}$/.test(linkedGroupCode)) setJoinCodeInput(linkedGroupCode);

      if (savedCode && savedRole !== "none") {
        setGroupCode(savedCode);
        setRole(savedRole);
        loadGroupData(savedCode);
      }
    });
  }, []);

  useEffect(() => {
    if (!groupCode || role === "none") return;

    localStorage.removeItem(`group_unread_${groupCode}`);

    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("discover_group_tracker");
      broadcastChannelRef.current = bc;
      bc.onmessage = (event) => {
        if (event.data?.code === groupCode) {
          loadGroupData(groupCode);
        }
      };
    }

    const channelName = `group-tracker:${groupCode}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "NEW_NOTE" }, (payload) => {
        if (payload?.payload?.note) {
          setNotes((prev) => [payload.payload.note, ...prev.filter((n) => n.id !== payload.payload.note.id)]);
          localStorage.setItem(`group_unread_${groupCode}`, "true");
        }
      })
      .on("broadcast", { event: "MEMBER_JOINED" }, (payload) => {
        if (payload?.payload?.member) {
          const joinedName = payload.payload.member.name;
          setJoinNotice(`${joinedName} joined the group.`);
          window.setTimeout(() => setJoinNotice(""), 5000);
          setMembers((prev) => {
            if (prev.some((m) => m.id === payload.payload.member.id)) return prev;
            const updated = [...prev, payload.payload.member];
            localStorage.setItem(STORAGE_KEYS.MEMBERS(groupCode), JSON.stringify(updated));
            return updated;
          });
        }
      })
      .on("broadcast", { event: "LOCATION_UPDATE" }, (payload) => {
        if (payload?.payload?.location) {
          const loc = payload.payload.location;
          setMembers((prev) =>
            prev.map((m) =>
              m.id === loc.memberId
                ? { ...m, lat: loc.lat, lng: loc.lng, lastUpdated: loc.lastUpdated }
                : m
            )
          );
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void reconcileGroup(groupCode).catch((error: Error) => {
            console.error("Group realtime reconnect reconciliation failed:", error);
            setSyncError("Live membership sync is temporarily unavailable. Existing group sharing still works.");
          });
        }
      });

    realtimeChannelRef.current = channel;

    const interval = setInterval(() => {
      loadGroupData(groupCode);
    }, 3000);

    return () => {
      clearInterval(interval);
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
    };
  }, [groupCode, reconcileGroup, role]);

  const notifyBroadcast = (type: "NEW_NOTE" | "MEMBER_JOINED" | "LOCATION_UPDATE", payload: GroupBroadcastPayload) => {
    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ code: groupCode, type, payload });
      } catch (e) {
        console.warn("Failed to post message on BroadcastChannel:", e);
      }
    }
    if (realtimeChannelRef.current) {
      try {
        realtimeChannelRef.current.send({
          type: "broadcast",
          event: type,
          payload,
        });
      } catch (e) {
        console.warn("Failed to send message on Realtime channel:", e);
      }
    }
  };

  const handleCreateGroup = async () => {
    const nameToUse = userName.trim() || t("Group Coordinator");
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const currentUserId = userId || `user_${Math.random().toString(36).substring(2, 7)}`;

    setGroupCode(code);
    setRole("coordinator");
    setCoordinatorName(nameToUse);

    const initialMember: Member = {
      id: currentUserId,
      name: nameToUse,
      role: "coordinator",
      lat: 20.006,
      lng: 73.79,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: t("Group Leader")
    };

    const initialNote: Note = {
      id: `note_${Date.now()}`,
      senderName: nameToUse,
      senderRole: "coordinator",
      message: `${t("Welcome to")} ${createGroupTitle.trim() || 'our Nashik group'}!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const initialMembersList = [initialMember];
    const initialNotesList = [initialNote];

    try {
      await syncGroupRequest("/groups", {
        groupCode: code,
        groupName: createGroupTitle.trim() || "Nashik Yatra Group",
        memberId: currentUserId,
        displayName: nameToUse,
      });
      setSyncError("");
    } catch (error) {
      console.error("Group registration failed:", error);
      setSyncError("Live membership sync is temporarily unavailable. Existing group sharing still works.");
    }

    setMembers(initialMembersList);
    setNotes(initialNotesList);

    localStorage.setItem(STORAGE_KEYS.ACTIVE_CODE, code);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, "coordinator");
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_NAME, nameToUse);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, currentUserId);
    localStorage.setItem(STORAGE_KEYS.COORDINATOR(code), nameToUse);
    localStorage.setItem(STORAGE_KEYS.MEMBERS(code), JSON.stringify(initialMembersList));
    localStorage.setItem(STORAGE_KEYS.NOTES(code), JSON.stringify(initialNotesList));

    supabase.from("groups").insert({
      code,
      group_name: createGroupTitle.trim() || "Nashik Yatra Group",
      coordinator_name: nameToUse,
    }).then(() => {});
    void reconcileGroup(code).catch((error: Error) => {
      console.error("Created group membership synchronization failed:", error);
      setSyncError("Live membership sync is temporarily unavailable. Existing group sharing still works.");
    });
  };

  const handleJoinGroup = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (code.length < 3) return;

    const nameToUse = userName.trim() || `Member ${Math.floor(100 + Math.random() * 900)}`;
    const currentUserId = userId || `user_${Math.random().toString(36).substring(2, 7)}`;

    setGroupCode(code);
    setRole("member");

    const existingCoord = localStorage.getItem(STORAGE_KEYS.COORDINATOR(code)) || t("Group Coordinator");
    setCoordinatorName(existingCoord);

    const existingMembersStr = localStorage.getItem(STORAGE_KEYS.MEMBERS(code));
    const currentMembers: Member[] = existingMembersStr ? JSON.parse(existingMembersStr) : [
      { id: 'coord_id', name: existingCoord, role: 'coordinator', lat: 20.006, lng: 73.79, lastUpdated: 'Just now' }
    ];

    const existingIndex = currentMembers.findIndex(m => m.id === currentUserId || m.name.toLowerCase() === nameToUse.toLowerCase());
    const newMemberObj: Member = {
      id: currentUserId,
      name: nameToUse,
      role: "member",
      lat: 20.00 + (Math.random() * 0.02 - 0.01),
      lng: 73.78 + (Math.random() * 0.02 - 0.01),
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (existingIndex >= 0) {
      currentMembers[existingIndex] = { ...currentMembers[existingIndex], ...newMemberObj };
    } else {
      currentMembers.push(newMemberObj);
    }

    let backendJoined = false;
    try {
      let joinResult;
      try {
        joinResult = await syncGroupRequest(`/groups/${encodeURIComponent(code)}/join`, {
          memberId: currentUserId,
          displayName: nameToUse,
        });
      } catch (joinError) {
        const { data: legacyGroup } = await supabase
          .from("groups")
          .select("code, group_name")
          .eq("code", code)
          .maybeSingle();
        if (!legacyGroup) throw joinError;
        await syncGroupRequest("/groups", { groupCode: code, groupName: legacyGroup.group_name, reconcileOnly: true });
        const savedMembers = localStorage.getItem(STORAGE_KEYS.MEMBERS(code));
        if (savedMembers) {
          await syncGroupRequest(`/groups/${encodeURIComponent(code)}/sync`, {
            currentMemberId: userId,
            members: JSON.parse(savedMembers),
          });
        }
        joinResult = await syncGroupRequest(`/groups/${encodeURIComponent(code)}/join`, {
          memberId: currentUserId,
          displayName: nameToUse,
        });
      }
      const oldMembers = new Map(currentMembers.map((member) => [member.id, member]));
      const serverMembers = (joinResult.members || []).map((member: Member) => ({
        ...oldMembers.get(member.id),
        ...member,
      }));
      currentMembers.splice(0, currentMembers.length, ...serverMembers);
      backendJoined = true;
      setSyncError("");
    } catch (error) {
      console.error("Group join synchronization failed:", error);
      setSyncError("Live membership sync is temporarily unavailable. Existing group sharing still works.");
    }

    setMembers(currentMembers);

    localStorage.setItem(STORAGE_KEYS.ACTIVE_CODE, code);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, "member");
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_NAME, nameToUse);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, currentUserId);
    localStorage.setItem(STORAGE_KEYS.MEMBERS(code), JSON.stringify(currentMembers));

    loadGroupData(code);
    if (!backendJoined) notifyBroadcast("MEMBER_JOINED", { member: newMemberObj });
    void reconcileGroup(code).catch((error: Error) => {
      console.error("Joined group membership synchronization failed:", error);
      setSyncError("Live membership sync is temporarily unavailable. Existing group sharing still works.");
    });
  };

  const handlePostNote = (textToPost?: string) => {
    const messageText = (textToPost || noteInput).trim();
    if (!messageText || !groupCode) return;

    const sender = userName.trim() || (role === "coordinator" ? t("Group Coordinator") : t("Group Member"));
    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      senderName: sender,
      senderRole: role === "coordinator" ? "coordinator" : "member",
      message: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    setNoteInput("");

    localStorage.setItem(STORAGE_KEYS.NOTES(groupCode), JSON.stringify(updatedNotes));

    const updatedMembers = members.map(m =>
      (m.name === sender || m.id === userId) ? { ...m, note: messageText, lastUpdated: newNote.timestamp } : m
    );
    setMembers(updatedMembers);
    localStorage.setItem(STORAGE_KEYS.MEMBERS(groupCode), JSON.stringify(updatedMembers));

    notifyBroadcast("NEW_NOTE", { note: newNote });
    localStorage.setItem(`group_unread_${groupCode}`, "true");
    void syncGroupRequest(`/groups/${encodeURIComponent(groupCode)}/messages`, {
      messageId: newNote.id,
      senderId: userId,
      senderName: sender,
      senderRole: role,
      message: messageText,
    }).catch((error: Error) => {
      console.error("Group message notification sync failed:", error);
    });

    supabase.from("group_notes").insert({
      group_code: groupCode,
      sender_name: sender,
      sender_role: role === "coordinator" ? "coordinator" : "member",
      message: messageText
    }).then(() => {});
  };

  const handleUpdateLocation = (lat: number, lng: number) => {
    if (!groupCode) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentMemberId = userId || userName;

    const updatedMembers = members.map((m) =>
      m.id === currentMemberId || m.name === userName
        ? { ...m, lat, lng, lastUpdated: timeStr }
        : m
    );

    setMembers(updatedMembers);
    localStorage.setItem(STORAGE_KEYS.MEMBERS(groupCode), JSON.stringify(updatedMembers));

    notifyBroadcast("LOCATION_UPDATE", {
      location: { memberId: currentMemberId, lat, lng, lastUpdated: timeStr }
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareGroup = () => {
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/group-tracker?code=${groupCode}` : groupCode;
    if (navigator.share) {
      navigator.share({
        title: t("Discover Nashik Group Tracker"),
        text: `${t("Join a Group")}: ${groupCode}`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${t("Join a Group")}: ${groupCode}`);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleLeaveGroup = () => {
    void syncGroupRequest(`/groups/${encodeURIComponent(groupCode)}/leave`, { memberId: userId })
      .catch((error: Error) => console.error("Group membership leave sync failed:", error));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_CODE);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);

    setRole("none");
    setGroupCode("");
    setNotes([]);
    setMembers([]);
    setJoinCodeInput("");
  };

  if (role === "none") {
    return (
      <div className="min-h-[85vh] bg-[#fffdf8] text-slate-800 py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-700 text-[#c9580f] dark:text-orange-200 font-bold text-xs uppercase tracking-wider mb-4 shadow-sm">
              <Sparkles className="h-4 w-4 text-[#e86f18] dark:text-orange-300" />
              <span>{t("Real-Time Live Tracking")}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#173247] tracking-tight mb-4">
              Discover Nashik <span className="text-[#e86f18]">{t("Group Tracker")}</span>
            </h1>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              {t("Stay synchronized with your family, trek buddies, and pilgrimage group across Nashik. Share live notes, meeting points, and GPS locations in real time.")}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border border-[#e7b06d]/40 mb-10 max-w-xl mx-auto">
            <label htmlFor={`your-display-name-${instanceId}`} className="block text-xs font-extrabold uppercase tracking-wider text-[#a45317] mb-2 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-[#e86f18]" />
              <span>{t("Your Display Name")}</span>
            </label>
            <input
              id={`your-display-name-${instanceId}`}
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#d8c4a3] bg-[#fffaf0] focus:ring-2 focus:ring-[#e86f18] outline-none font-semibold text-slate-900 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-2">
              {t("This name will be visible to members of your group as your broadcast sender ID.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#e7b06d]/50 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div>
                <div className="h-14 w-14 rounded-2xl bg-orange-100 text-[#e86f18] flex items-center justify-center mb-6 shadow-inner">
                  <Crown className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2.5 py-0.5 rounded-full">
                    {t("Group Creator")}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#173247] mb-2">{t("Create New Group")}</h2>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  {t("Start a fresh group as the Group Coordinator. Generate a 6-character code and invite your friends.")}
                </p>

                <div className="mb-6">
                  <label htmlFor={`group-title-${instanceId}`} className="block text-xs font-semibold text-slate-500 mb-1">{t("Group Title (Optional)")}</label>
                  <input
                    id={`group-title-${instanceId}`}
                    type="text"
                    placeholder="e.g. Ramkund Yatra 2026"
                    value={createGroupTitle}
                    onChange={(e) => setCreateGroupTitle(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateGroup}
                className="w-full bg-[#e86f18] hover:bg-[#c9580f] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 text-base active:scale-95 cursor-pointer"
              >
                <Users className="h-5 w-5" />
                <span>{t("Start New Group")}</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#e7b06d]/50 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div>
                <div className="h-14 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-inner">
                  <UserPlus className="h-7 w-7" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">
                    {t("Group Member")}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-[#173247] mb-2">{t("Join a Group")}</h2>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  {t("Enter the 6-character unique code shared by your Group Coordinator to join instantly.")}
                </p>

                <div className="mb-6">
                  <label htmlFor={`enter-group-code-${instanceId}`} className="block text-xs font-semibold text-slate-500 mb-1">{t("Enter Group Code")}</label>
                  <input
                    id={`enter-group-code-${instanceId}`}
                    type="text"
                    placeholder="e.g. NK8P9X"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    maxLength={6}
                    className="w-full text-center tracking-widest font-mono text-xl font-bold py-3 rounded-2xl border-2 border-[#d8c4a3] bg-[#fffaf0] focus:ring-2 focus:ring-[#e86f18] outline-none uppercase text-slate-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleJoinGroup}
                disabled={joinCodeInput.trim().length < 3}
                className="w-full bg-[#173247] hover:bg-slate-800 disabled:opacity-40 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-base active:scale-95 cursor-pointer"
              >
                <UserPlus className="h-5 w-5" />
                <span>{t("Join Group Now")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const latestNote = notes.length > 0 ? notes[0] : null;

  return (
    <div className="min-h-screen bg-[#fffdf8] py-8 px-4 sm:px-6 md:px-8 text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl p-6 shadow-md border border-[#e7b06d]/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-orange-100 text-[#c9580f] text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 border border-orange-200">
                <Radio className="h-3.5 w-3.5 animate-pulse text-[#e86f18]" />
                {t("Live Syncing Active")}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {t("Code:")} <strong className="font-mono text-slate-700">{groupCode}</strong>
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-[#173247] tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7 text-[#e86f18]" />
              <span>{createGroupTitle || t("Discover Nashik Group Tracker")}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1.5 bg-[#fff7ed] hover:bg-[#ffedd5] text-[#c9580f] border border-[#e7b06d] font-semibold text-xs py-2 px-3.5 rounded-xl transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? t("Code Copied!") : `${t("Copy Code")} (${groupCode})`}</span>
            </button>

            <button
              type="button"
              onClick={shareGroup}
              className="flex items-center gap-1.5 bg-[#e86f18] hover:bg-[#c9580f] text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-colors shadow-sm"
            >
              <Share2 className="h-4 w-4" />
              <span>{shared ? t("Link Copied!") : t("Share Group")}</span>
            </button>
          </div>
        </div>

        {syncError && (
          <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            {syncError}
          </p>
        )}
        {joinNotice && (
          <p role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800">
            {joinNotice}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#e7b06d]/40">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-extrabold text-[#a45317] uppercase tracking-wider flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#e86f18]" />
                  <span>{t("Latest Group Update")}</span>
                </h3>
                {latestNote && (
                  <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {latestNote.timestamp}
                  </span>
                )}
              </div>

              {latestNote ? (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-[#e86f18] p-4 rounded-r-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-slate-900 text-sm">
                      {latestNote.senderName}
                    </span>
                    {latestNote.senderRole === "coordinator" ? (
                      <span className="bg-[#e86f18] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Crown className="h-2.5 w-2.5" /> {t("Group Coordinator")}
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {t("Group Member")}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 text-lg font-medium leading-relaxed">
                    &quot;{latestNote.message}&quot;
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 p-6 rounded-2xl text-center text-slate-400 text-sm">
                  {t("No updates posted yet. Be the first member to share a note below!")}
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#e7b06d]/40">
              <h3 className="text-base font-bold text-[#173247] mb-2 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#e86f18]" />
                <span>{t("Post a Note / Update for Group")}</span>
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {t("Posting as:")} <strong className="text-slate-800 font-semibold">{userName || "You"}</strong> ({role === "coordinator" ? t("Group Coordinator") : t("Group Member")})
              </p>

              <div className="mb-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t("Quick Presets:")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_MESSAGES.map((msg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePostNote(msg)}
                      className="text-xs bg-[#fff7ed] hover:bg-[#ffedd5] text-[#c9580f] border border-[#e7b06d]/60 font-semibold py-1.5 px-3 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      {t(msg)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t("Type a custom message (e.g. Waiting near Panchavati)...")}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePostNote()}
                  className="flex-1 px-4 py-3 rounded-2xl border border-[#d8c4a3] bg-[#fffaf0] focus:ring-2 focus:ring-[#e86f18] outline-none font-medium text-sm text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => handlePostNote()}
                  disabled={!noteInput.trim()}
                  className="bg-[#e86f18] hover:bg-[#c9580f] disabled:opacity-40 text-white font-bold p-3.5 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center min-w-[50px] cursor-pointer"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#e7b06d]/40">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#173247] flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#e86f18]" />
                  <span>{t("Message & Update History")}</span>
                </h3>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  {notes.length} {notes.length === 1 ? t("Note") : t("Notes")}
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-orange-200 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {note.senderName}
                        </span>
                        {note.senderRole === "coordinator" ? (
                          <span className="bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase">
                            {t("Coordinator")}
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-md">
                            {t("Member")}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {note.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm font-normal leading-normal">
                      {t(note.message)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#e7b06d]/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#173247] flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#e86f18]" />
                    <span>{t("Live Group Location Map")}</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t("Live GPS markers for authorized group members only.")}
                  </p>
                </div>
              </div>

              <GroupMapComponent
                members={members.map((m) => ({
                  id: m.id,
                  name: m.name,
                  role: m.role,
                  lat: m.lat || 20.0,
                  lng: m.lng || 73.78,
                  lastUpdated: m.lastUpdated || "Just now",
                  note: m.note,
                }))}
                currentMemberId={userId || userName}
                onUpdateLocation={handleUpdateLocation}
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-orange-500 to-[#c9580f] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-[-10px] top-[-10px] opacity-10">
                <Crown className="w-36 h-36" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Crown className="h-3.5 w-3.5 text-amber-300" />
                  {t("Group Coordinator")}
                </span>
              </div>

              <h2 className="text-2xl font-black mb-1">
                {coordinatorName || t("Coordinator")}
              </h2>
              <p className="text-orange-100 text-xs mb-4">
                {t("Code:")} <strong className="font-mono text-white font-bold">{groupCode}</strong>
              </p>

              <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs text-orange-100">
                <span>{t("Status: Active Leader")}</span>
                <ShieldCheck className="h-4 w-4 text-amber-300" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#e7b06d]/40">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#173247] flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#e86f18]" />
                  <span>{t("Group Members")}</span>
                </h3>
                <span className="text-xs font-bold bg-orange-100 text-[#c9580f] px-2.5 py-1 rounded-full">
                  {members.length} {t("Active")}
                </span>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {members.map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-orange-50/50 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-9 w-9 rounded-full font-bold flex items-center justify-center text-sm shadow-sm ${
                          m.role === "coordinator"
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                          <span>{m.name}</span>
                          {m.name === userName && (
                            <span className="text-[10px] text-slate-400 font-normal">({t("You")})</span>
                          )}
                        </div>
                        {m.lastUpdated && (
                          <div className="text-[10px] text-slate-400">
                            Seen: {m.lastUpdated}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      {m.role === "coordinator" ? (
                        <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-200">
                          <Crown className="h-3 w-3 text-orange-500" /> {t("Leader")}
                        </span>
                      ) : (
                        <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                          {t("Member")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#e7b06d]/40 text-center space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#a45317] flex items-center justify-center gap-1.5">
                <QrCode className="h-4 w-4 text-[#e86f18]" />
                <span>{t("Scan or Share Group Code")}</span>
              </h3>

              <div className="bg-[#fffaf0] p-4 rounded-2xl border border-[#e7b06d]/40 inline-block shadow-inner">
                <QRCodeSVG
                  value={typeof window !== "undefined" ? `${window.location.origin}/group-tracker?code=${groupCode}` : groupCode}
                  size={150}
                />
              </div>

              <div className="bg-slate-100 py-2 px-4 rounded-xl font-mono text-2xl font-black text-slate-900 tracking-widest border border-slate-200">
                {groupCode}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex-1 bg-[#fff7ed] hover:bg-[#ffedd5] text-[#c9580f] border border-[#e7b06d] font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? t("Copied") : t("Copy Code")}</span>
                </button>

                <button
                  type="button"
                  onClick={shareGroup}
                  className="flex-1 bg-[#e86f18] hover:bg-[#c9580f] text-white font-semibold text-xs py-2.5 px-3 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{t("Share")}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLeaveGroup}
              className="w-full text-center text-red-600 font-bold py-3.5 rounded-2xl hover:bg-red-50 transition-colors border border-red-200 bg-white flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("Leave Group")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
