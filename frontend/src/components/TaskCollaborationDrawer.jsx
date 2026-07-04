import { useState, useEffect, useRef } from "react";
import { 
  X, 
  MessageSquare, 
  Eye, 
  EyeOff, 
  Share2, 
  Paperclip, 
  Download, 
  FileText, 
  File, 
  Image as ImageIcon,
  History, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Code, 
  Link as LinkIcon,
  Smile, 
  Send, 
  CornerDownRight, 
  Trash2, 
  Edit3, 
  UserCheck 
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import Avatar from "./Avatar";

export default function TaskCollaborationDrawer({ task, onClose, onUpdate }) {
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [watchers, setWatchers] = useState({ watchers_count: 0, is_watching: false });
  const [teamMembers, setTeamMembers] = useState([]);

  // Comment Editor States
  const [commentText, setCommentText] = useState("");
  const [replyToId, setReplyToId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState("");

  // Mention Suggestions overlay
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionCoords, setMentionCoords] = useState({ top: 0, left: 0 });
  const inputRef = useRef(null);

  // Active sub-tabs: discussion, files, timeline
  const [activeTab, setActiveTab] = useState("discussion"); // discussion, files, timeline

  const fetchComments = () => {
    api.get(`/tasks/${task.id}/comments`).then(res => setComments(res.data));
  };

  const fetchAttachments = () => {
    api.get(`/tasks/${task.id}/attachments`).then(res => setAttachments(res.data));
  };

  const fetchTimeline = () => {
    api.get(`/tasks/${task.id}/timeline`).then(res => setTimeline(res.data));
  };

  const fetchWatchers = () => {
    api.get(`/tasks/${task.id}/watchers`).then(res => setWatchers(res.data));
  };

  useEffect(() => {
    if (task?.id) {
      fetchComments();
      fetchAttachments();
      fetchTimeline();
      fetchWatchers();
      // Fetch users list for mentions lookup
      api.get("/users").then(res => setTeamMembers(res.data));
    }
  }, [task]);

  // Share task link
  const handleShare = () => {
    const link = `${window.location.origin}/dashboard?highlight=${task.id}`;
    navigator.clipboard.writeText(link);
    toast.success("Task share link copied to clipboard!");
  };

  // Toggle watcher
  const handleWatchToggle = () => {
    api.post(`/tasks/${task.id}/watch`).then(res => {
      setWatchers(prev => ({
        watchers_count: res.data.is_watching ? prev.watchers_count + 1 : prev.watchers_count - 1,
        is_watching: res.data.is_watching
      }));
      fetchTimeline();
      toast.success(res.data.is_watching ? "You are now watching this task" : "Unwatched task");
    });
  };

  // Add format tags to input area
  const insertFormat = (tagStart, tagEnd = "") => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const selected = text.substring(start, end);
    const replacement = tagStart + selected + tagEnd;
    setCommentText(text.substring(0, start) + replacement + text.substring(end));
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + tagStart.length, start + tagStart.length + selected.length);
    }, 50);
  };

  // Mentions handler
  const handleInputChange = (e) => {
    const value = e.target.value;
    setCommentText(value);

    // Check if cursor is next to @ symbol
    const cursor = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf("@");
    
    if (lastAt !== -1 && lastAt >= textBeforeCursor.length - 20) {
      const searchStr = textBeforeCursor.substring(lastAt + 1);
      if (!searchStr.includes(" ")) {
        setMentionSearch(searchStr);
        setShowMentions(true);
        // Position suggests overlay above input area roughly
        setMentionCoords({ top: -140, left: 16 });
        return;
      }
    }
    setShowMentions(false);
  };

  const handleSelectMention = (member) => {
    const input = inputRef.current;
    if (!input) return;
    const cursor = input.selectionStart;
    const value = commentText;
    const lastAt = value.substring(0, cursor).lastIndexOf("@");
    const before = value.substring(0, lastAt);
    const after = value.substring(cursor);
    const replacement = `@${member.name} `;
    setCommentText(before + replacement + after);
    setShowMentions(false);
    setTimeout(() => {
      input.focus();
      const newCursorPos = lastAt + replacement.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Post Comment
  const handlePostComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    api.post(`/tasks/${task.id}/comments`, {
      content: commentText,
      parent_id: replyToId
    }).then(() => {
      setCommentText("");
      setReplyToId(null);
      fetchComments();
      fetchTimeline();
      toast.success("Comment added!");
    });
  };

  // Edit Comment
  const handleSaveEdit = (commentId) => {
    if (!editText.trim()) return;
    api.put(`/comments/${commentId}`, { content: editText }).then(() => {
      setEditingCommentId(null);
      fetchComments();
      toast.success("Comment updated");
    });
  };

  // Delete Comment
  const handleDeleteComment = (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      api.delete(`/comments/${commentId}`).then(() => {
        fetchComments();
        toast.success("Comment removed");
      });
    }
  };

  // Reactions toggle
  const handleReact = (commentId, emoji) => {
    api.post(`/comments/${commentId}/react`, { emoji }).then(() => {
      fetchComments();
    });
  };

  // File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64Data = reader.result;
      api.post(`/tasks/${task.id}/attachments`, {
        filename: file.name,
        file_size: file.size,
        file_type: file.type || "application/octet-stream",
        file_data: base64Data
      }).then(() => {
        fetchAttachments();
        fetchTimeline();
        toast.success("File attached successfully!");
      });
    };
  };

  // Download File Attachment
  const handleDownload = (attach) => {
    api.get(`/attachments/${attach.id}/download`).then(res => {
      const link = document.createElement("a");
      link.href = res.data.file_data;
      link.download = res.data.filename;
      link.click();
    });
  };

  // Render relative time string
  const getRelativeTime = (isoString) => {
    if (!isoString) return "Just now";
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return "Just now";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  // Helper to parse mentions into styled badge tags inside comments content
  const parseCommentHTML = (text) => {
    if (!text) return "";
    let formatted = text;
    // Bold, Italic, Underline markdown
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formatted = formatted.replace(/<u>(.*?)<\/u>/g, "<u>$1</u>");
    formatted = formatted.replace(/`(.*?)`/g, "<code class='bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[11px]'>$1</code>");
    // Highlights @mentions
    formatted = formatted.replace(/@([\w\.\-]+)/g, "<span class='px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-full font-bold text-[10px] inline-flex items-center gap-0.5 border dark:border-indigo-900/30'>@$1</span>");
    return formatted;
  };

  // Filter mentions list
  const filteredMentions = teamMembers.filter(m => 
    m.name.toLowerCase().includes(mentionSearch.toLowerCase()) || 
    m.email.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Tap outside area */}
      <div className="flex-1" onClick={onClose} />

      {/* Side Drawer Body */}
      <div className="w-[480px] sm:w-[550px] bg-slate-50 dark:bg-[#080B1E] h-full shadow-2xl flex flex-col justify-between border-l dark:border-slate-850 animate-slideLeft select-none pointer-events-auto">
        
        {/* Header Block */}
        <div className="p-6 bg-white dark:bg-slate-900 border-b dark:border-slate-850 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Task Workspace
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                {task.title}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick share / watch controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleWatchToggle}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border ${
                watchers.is_watching 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/40 dark:border-indigo-900/40 dark:text-indigo-400" 
                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-750 text-slate-500 dark:text-slate-450 hover:bg-slate-50"
              }`}
            >
              {watchers.is_watching ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{watchers.is_watching ? "Watching" : "Watch"}</span>
              <span className="bg-slate-200/50 dark:bg-slate-950/40 text-[9px] px-1.5 py-0.5 rounded font-black">
                {watchers.watchers_count}
              </span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-750 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-450 hover:bg-slate-50 transition"
            >
              <Share2 size={14} />
              <span>Share Task</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b dark:border-slate-850 bg-white dark:bg-slate-900 text-xs font-bold">
          {[
            { id: "discussion", label: "Discussions", icon: MessageSquare },
            { id: "files", label: "Attachments", icon: Paperclip },
            { id: "timeline", label: "Activity Logs", icon: History }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition ${
                  active 
                    ? "border-indigo-600 text-indigo-600 dark:text-white" 
                    : "border-transparent text-slate-400 hover:text-slate-650"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrolling Core Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "discussion" && (
            <div className="space-y-6">
              {/* Nested Comments Rendering helper */}
              {comments.filter(c => !c.parent_id).length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  No comments logged in discussion thread. Start the conversation below!
                </div>
              ) : (
                <div className="space-y-5">
                  {comments.filter(c => !c.parent_id).map((c) => {
                    const replies = comments.filter(r => r.parent_id === c.id);
                    return (
                      <div key={c.id} className="space-y-3.5">
                        {/* Main Comment */}
                        <div className="bg-white dark:bg-slate-900/60 p-4 border border-slate-100 dark:border-slate-850 rounded-[24px] space-y-3 shadow-xs">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <Avatar user={c.user} size="xs" />
                              <div>
                                <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-none">
                                  {c.user.name}
                                </h4>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold">
                                  {getRelativeTime(c.created_at)} {c.is_edited && "(Edited)"}
                                </span>
                              </div>
                            </div>
                            
                            {/* Edit / Delete actions */}
                            <div className="flex gap-1">
                              <button 
                                onClick={() => setReplyToId(c.id)}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                              >
                                Reply
                              </button>
                              {c.user_id === task.assigned_to && (
                                <>
                                  <button 
                                    onClick={() => { setEditingCommentId(c.id); setEditText(c.content); }}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded transition"
                                  >
                                    <Edit3 size={12} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteComment(c.id)}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded transition"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Body Text */}
                          {editingCommentId === c.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none text-slate-850 dark:text-white"
                              />
                              <div className="flex justify-end gap-1.5">
                                <button 
                                  onClick={() => setEditingCommentId(null)}
                                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-white rounded-lg text-[10px] font-bold"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleSaveEdit(c.id)}
                                  className="px-3 py-1.5 bg-indigo-650 text-white rounded-lg text-[10px] font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p 
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed break-words"
                              dangerouslySetInnerHTML={{ __html: parseCommentHTML(c.content) }}
                            />
                          )}

                          {/* Reactions & Reaction Bar */}
                          <div className="flex items-center gap-1.5 pt-1.5 border-t dark:border-slate-800/40">
                            {["👍", "❤️", "😂", "🎉"].map(emoji => {
                              const users = c.reactions[emoji] || [];
                              const active = users.includes(c.user_id);
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(c.id, emoji)}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] border transition ${
                                    active 
                                      ? "bg-indigo-50 border-indigo-200 text-indigo-650 dark:bg-indigo-950/40 dark:border-indigo-900/30" 
                                      : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 text-slate-450 hover:bg-slate-50"
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  {users.length > 0 && <span className="font-black text-[9px]">{users.length}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Reply Thread List */}
                        {replies.map(reply => (
                          <div key={reply.id} className="flex gap-2.5 pl-6">
                            <CornerDownRight className="text-slate-300 shrink-0 mt-2" size={16} />
                            <div className="flex-1 bg-slate-100/50 dark:bg-slate-900/30 p-3.5 border dark:border-slate-850 rounded-[20px] space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <Avatar user={reply.user} size="xxs" />
                                  <div>
                                    <h5 className="font-bold text-[11px] text-slate-800 dark:text-white">
                                      {reply.user.name}
                                    </h5>
                                    <span className="text-[8px] text-slate-400 dark:text-slate-500 font-semibold">
                                      {getRelativeTime(reply.created_at)}
                                    </span>
                                  </div>
                                </div>
                                {reply.user_id === task.assigned_to && (
                                  <button 
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded transition"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                )}
                              </div>
                              <p 
                                className="text-[11px] font-semibold text-slate-650 dark:text-slate-350 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: parseCommentHTML(reply.content) }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "files" && (
            <div className="space-y-6">
              {/* Drop File triggers */}
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 relative group hover:border-indigo-650 transition cursor-pointer">
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx,.zip"
                />
                <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 rounded-2xl flex items-center justify-center shadow-xs">
                  <Paperclip size={24} className="group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                  <h4 className="font-bold text-xs dark:text-white">Upload Task Attachments</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                    Supports Images, PDF, DOCX, XLSX, ZIP. Max 5MB
                  </p>
                </div>
              </div>

              {/* Attachments List */}
              {attachments.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  No files uploaded to this task board yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {attachments.map((attach) => {
                    const isImg = attach.file_type.startsWith("image/");
                    return (
                      <div key={attach.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 flex flex-col justify-between h-40 shadow-xs group">
                        <div className="h-24 bg-slate-50 dark:bg-slate-950/50 rounded-xl flex items-center justify-center relative overflow-hidden border dark:border-slate-800">
                          {isImg ? (
                            <img src={attach.file_data || "/placeholder-image.png"} alt={attach.filename} className="w-full h-full object-cover" />
                          ) : (
                            <FileText size={32} className="text-slate-400" />
                          )}
                          <button
                            onClick={() => handleDownload(attach)}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                          >
                            <Download size={20} />
                          </button>
                        </div>

                        <div className="flex justify-between items-center mt-2.5">
                          <div className="overflow-hidden space-y-0.5">
                            <h5 className="font-bold text-[10px] truncate text-slate-800 dark:text-white">{attach.filename}</h5>
                            <span className="text-[8px] text-slate-400 dark:text-slate-550 font-black">
                              {Math.round(attach.file_size / 1024)} KB
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-6">
              {timeline.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                  No activity logs registered.
                </div>
              ) : (
                <div className="space-y-6 relative pl-6 border-l-2 dark:border-slate-800 ml-3">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative space-y-1 font-semibold text-xs leading-normal">
                      <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-indigo-650 border-[3px] border-slate-50 dark:border-[#080B1E]" />
                      <div className="flex justify-between items-center">
                        <span className="font-bold dark:text-white capitalize">{event.event_type}</span>
                        <span className="text-[8px] text-slate-400 font-bold">{getRelativeTime(event.created_at)}</span>
                      </div>
                      <p className="text-slate-450 dark:text-slate-500 text-[11px] font-medium leading-relaxed">
                        {event.details} by <strong className="text-slate-600 dark:text-slate-300 font-bold">{event.user_name}</strong>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area (Only visible for Discussions tab) */}
        {activeTab === "discussion" && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-850 space-y-3 relative">
            
            {/* Mention lookup popup */}
            {showMentions && (
              <div 
                className="absolute bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 w-64 max-h-48 overflow-y-auto p-2 space-y-1 z-50 pointer-events-auto"
                style={mentionCoords}
              >
                <div className="p-1 text-[8px] font-black uppercase text-indigo-400 tracking-wider">
                  Mention Team Member
                </div>
                {filteredMentions.length === 0 ? (
                  <div className="p-2 text-[10px] text-slate-400">No members matched</div>
                ) : (
                  filteredMentions.map(member => (
                    <button
                      key={member.id}
                      onClick={() => handleSelectMention(member)}
                      className="w-full text-left p-2 hover:bg-slate-800 rounded-xl flex items-center gap-2 text-xs font-bold"
                    >
                      <Avatar user={member} size="xxs" />
                      <div>
                        <div>{member.name}</div>
                        <div className="text-[9px] text-slate-500 font-medium">{member.email}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Replies banner tag */}
            {replyToId && (
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg border dark:border-slate-800 text-[10px] font-black text-slate-500">
                <span>Replying to comment thread...</span>
                <button onClick={() => setReplyToId(null)} className="text-red-500">Cancel</button>
              </div>
            )}

            {/* Formatting Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b dark:border-slate-850 text-slate-450">
              <div className="flex items-center gap-1">
                <button onClick={() => insertFormat("**", "**")} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition" title="Bold"><Bold size={14} /></button>
                <button onClick={() => insertFormat("*", "*")} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition" title="Italic"><Italic size={14} /></button>
                <button onClick={() => insertFormat("<u>", "</u>")} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition" title="Underline"><Underline size={14} /></button>
                <button onClick={() => insertFormat("\n- ")} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition" title="Bullet List"><List size={14} /></button>
                <button onClick={() => insertFormat("\n1. ")} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition" title="Numbered List"><ListOrdered size={14} /></button>
                <button onClick={() => insertFormat("`", "`")} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition" title="Code Block"><Code size={14} /></button>
                <button onClick={() => insertFormat("[", "](url)")} className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition" title="Hyperlink"><LinkIcon size={14} /></button>
              </div>

              {/* Quick emoji poppicker */}
              <div className="relative group">
                <button className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition text-slate-450 group-hover:text-slate-700"><Smile size={15} /></button>
                <div className="absolute right-0 bottom-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-2 hidden group-hover:flex gap-1.5 z-50">
                  {["👍", "❤️", "😂", "🎉", "😮", "😢"].map(emoji => (
                    <button key={emoji} onClick={() => insertFormat(emoji)} className="hover:scale-110 transition text-sm">{emoji}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comment Form Input box */}
            <form onSubmit={handlePostComment} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={commentText}
                onChange={handleInputChange}
                placeholder="Write a comment... (Type @ to mention team members)"
                className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none font-medium text-xs text-slate-800 dark:text-white h-16 resize-none"
              />
              <button
                type="submit"
                className="h-16 w-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center transition shrink-0 active:scale-95 shadow-md shadow-indigo-650/10"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
