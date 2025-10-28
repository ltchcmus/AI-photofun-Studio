import React, { useState } from 'react';
import { Home, Search, Plus, Heart, User, Menu, MessageCircle, MoreHorizontal, Sparkles, Image, X } from 'lucide-react';

// Default export is needed so this component can be imported and used elsewhere
export default function Dashboard() {
  const [selectedNav, setSelectedNav] = useState('home');
  const [showDropdown, setShowDropdown] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptText, setPromptText] = useState('');

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'create', icon: Plus, label: 'Create' },
    { id: 'ai-tools', icon: Sparkles, label: 'AI Tools' },
    { id: 'activity', icon: Heart, label: 'Activity' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const posts = [
    {
      id: 1,
      user: 'alex_chen',
      avatar: 'https://placehold.co/40x40/e2e8f0/64748b?text=A',
      verified: true,
      time: '3h ago',
      content: 'Cyberpunk cityscape at sunset 🌆. Experimenting with a new AI model, the results are impressive!',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop&q=80',
      likes: 8234,
      comments: 72,
      liked: false,
      hasPrompt: true,
      prompt: 'Cyberpunk city at sunset, neon lights, flying cars, detailed architecture, cinematic lighting, 8k resolution'
    },
    {
      id: 2,
      user: 'sarah_kim',
      avatar: 'https://placehold.co/40x40/fecaca/b91c1c?text=S',
      verified: false,
      time: '5h ago',
      content: 'Experimenting with a new portrait style 💫',
      image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=600&fit=crop&q=80',
      likes: 1567,
      comments: 89,
      liked: true,
      hasPrompt: true,
      prompt: 'Beautiful woman portrait, neon lighting, cyberpunk style, ultra detailed face, professional photography'
    },
    {
      id: 3,
      user: 'mike_creates',
      avatar: 'https://placehold.co/40x40/c7d2fe/4338ca?text=M',
      verified: true,
      time: '8h ago',
      content: 'Abstract art experimenting with AI. What do you think of this color combination?',
      image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&h=600&fit=crop&q=80',
      likes: 3421,
      comments: 156,
      liked: false,
      hasPrompt: false
    },
  ];

  const handleCreateClick = () => {
    // Always open modal when 'create' is clicked, regardless of the selected tab
    setShowCreateModal(true);
    // Still select the 'create' tab to highlight the icon
    setSelectedNav('create');
  };

  const handleNavClick = (id) => {
    if (id === 'create') {
      handleCreateClick();
    } else {
      setSelectedNav(id);
      // Close modal if it's open and a different tab is selected
      if (showCreateModal) {
        setShowCreateModal(false);
      }
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setPostContent('');
    setPostImage(null);
    setPromptText('');
    setShowPrompt(false);
    // Go back to 'home' tab if user closes modal
    // without posting and the 'create' tab was selected
    if (selectedNav === 'create') {
      setSelectedNav('home');
    }
  }

  // Handler for "Add Image" click (simulating file pick)
  const handleImageUpload = () => {
    // In a real application, this would be the logic to open a file picker
    // Here we just simulate it by setting a sample image
    setPostImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop&q=80');
  };

  // Post submission handler
  const handlePostSubmit = () => {
    // This is where post submission logic (e.g., API call) would go
    console.log("Posting:", { postContent, postImage, promptText });
    // Close modal after posting
    closeCreateModal();
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <div className="flex">
        {/* === Sidebar (Desktop) === */}
        {/* Add 'hidden' to hide on mobile and 'md:flex' to show from medium breakpoint up */}
        <aside className="fixed left-0 top-0 h-screen w-20 hidden md:flex flex-col items-center py-6 border-r border-gray-200">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <span className="text-white font-bold text-xl">@</span>
            </div>
          </div>

          {/* Nav Icons */}
          <nav className="flex-1 flex flex-col items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`p-3 rounded-xl transition-colors ${
                  selectedNav === item.id
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                }`}
                title={item.label} // Add tooltip for desktop
              >
                <item.icon className={`w-6 h-6 ${
                  selectedNav === item.id ? 'text-black' : 'text-gray-600'
                }`} />
              </button>
            ))}
          </nav>

          {/* Menu */}
          <button className="p-3 hover:bg-gray-50 rounded-xl transition-colors" title="More">
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        </aside>

        {/* === Main Content === */}
        {/* - Change 'ml-20' to 'ml-0 md:ml-20' to avoid offset on mobile
          - Add 'pb-20 md:pb-0' so content isn't obscured by bottom nav on mobile
        */}
        <main className="ml-0 md:ml-20 flex-1 pb-20 md:pb-0">
          {/* Top Bar */}
          <header className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-gray-200 z-10">
            {/* - Change 'px-6' to 'px-4 md:px-6' to reduce padding on mobile
            */}
            <div className="max-w-2xl mx-auto px-4 md:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <button className="text-sm font-semibold text-black relative">
                    For you
                    {/* Add active underline */}
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black rounded-full"></span>
                  </button>
                  <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Friends</button>
                </div>
              </div>
            </div>
          </header>

          {/* Feed */}
          <div className="max-w-2xl mx-auto">
            {/* Create Post Box (on feed) */}
            {/* - Change 'px-6' to 'px-4 md:px-6'
            */}
            <div className="border-b border-gray-200 px-4 md:px-6 py-4">
              <div className="flex gap-3 items-center">
                <img 
                  src="https://placehold.co/40x40/333/fff?text=U" 
                  alt="Your avatar" 
                  className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="What's new?"
                    onClick={() => handleNavClick('create')}
                    className="w-full outline-none text-gray-600 cursor-pointer placeholder-gray-500"
                    readOnly
                  />
                </div>
                <button 
                  onClick={() => handleNavClick('create')} 
                  className="p-2 -m-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  title="Add image"
                >
                  <Image className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Posts */}
            {posts.map((post) => (
              <article key={post.id} className="border-b border-gray-200 px-4 md:px-6 py-4">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <img 
                    src={post.avatar} 
                    alt={`${post.user} avatar`} 
                    className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm truncate">{post.user}</span>
                      {post.verified && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          {/* SVG path for verification check */}
                          <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="text-gray-500 text-sm flex-shrink-0">{post.time}</span>
                    </div>
                    {/* Add this line to show content right below the name */}
                    <p className="text-sm mt-1 md:hidden">{post.content}</p>
                  </div>
                  <button 
                    onClick={() => setShowDropdown(showDropdown === post.id ? null : post.id)}
                    className="p-1 -m-1 hover:bg-gray-100 rounded-full transition-colors relative"
                    title="Options"
                  >
                    <MoreHorizontal className="w-5 h-5 text-gray-500" />
                    {showDropdown === post.id && (
                      <div 
                        className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20"
                        onMouseLeave={() => setShowDropdown(null)} // Auto-close on mouse leave
                      >
                        <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors">Save</button>
                        <button className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors">Hide</button>
                        <button className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50 transition-colors">Report</button>
                      </div>
                    )}
                  </button>
                </div>

                {/* Content */}
                {/* - Use 'ml-13' (w-10 + gap-3) to align with avatar
                */}
                <div className="ml-13">
                  <p className="text-sm mb-3 hidden md:block">{post.content}</p>
                  
                  {post.image && (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 mb-3">
                      <img 
                        src={post.image} 
                        alt={`Post by ${post.user}`}
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Prompt Section */}
                  {post.hasPrompt && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3 border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-semibold text-gray-700">AI Prompt</span>
                      </div>
                      <p className="text-xs text-gray-600 font-mono leading-relaxed line-clamp-2">{post.prompt}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors group" title="Like">
                      <Heart className={`w-5 h-5 transition-colors ${post.liked ? 'fill-red-500 text-red-500' : 'text-gray-500 group-hover:text-red-500'}`} />
                      <span className="text-sm text-gray-600">{post.likes.toLocaleString()}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors" title="Comment">
                      <MessageCircle className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
                      <span className="text-sm text-gray-600">{post.comments}</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>

      {/* === Create Post Modal === */}
      {/* Add transition effect for modal */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          showCreateModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCreateModal} // Close when clicking on the overlay
      ></div>

      <div
        className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-transform duration-300 ${
          showCreateModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div 
          className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="font-semibold text-lg">New Post</h2>
            <button 
              onClick={closeCreateModal}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 overflow-y-auto">
            <div className="flex gap-3 mb-4">
              <img 
                src="https://placehold.co/40x40/333/fff?text=U" 
                alt="Your avatar" 
                className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"
              />
              <div className="flex-1">
                <span className="font-semibold text-sm">your_username</span>
              </div>
            </div>

            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share your artwork..."
              className="w-full outline-none resize-none text-base mb-4 placeholder-gray-500"
              rows="4"
            />

            {/* Image Preview */}
            {postImage && (
              <div className="relative mb-4">
                <img src={postImage} alt="Preview" className="w-full rounded-xl border border-gray-200" />
                <button 
                  onClick={() => setPostImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            {/* Prompt Section Toggle */}
            {/* Only show 'Add prompt' button when there is an image */}
            {postImage && (
              <div className="mb-4">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium p-1 -m-1"
                >
                  <Sparkles className="w-4 h-4" />
                  {showPrompt ? 'Hide prompt' : 'Add AI prompt'}
                </button>
                
                {/* Add slide effect for text area */}
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    showPrompt ? 'max-h-40 mt-3' : 'max-h-0'
                  }`}
                >
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <textarea
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="Enter the prompt you used to create this image..."
                      className="w-full bg-transparent outline-none resize-none text-xs font-mono placeholder-gray-500"
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            {/* Only show 'Add image' button if no image is present */}
            {!postImage && (
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={handleImageUpload}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Image className="w-4 h-4 text-gray-600" />
                  Add image
                </button>
                {/* Can add AI generation button here */}
                <button 
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Create with AI
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <button 
              className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!postContent && !postImage} // Only enable posting if there is content or an image
              onClick={handlePostSubmit}
            >
              Post
            </button>
          </div>
        </div>
      </div>


      {/* === Mobile Bottom Nav === */}
      {/* - 'md:hidden' is already present, this is correct
        - Increase 'px-6' to 'px-8' for more icon spacing
      */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 sm:px-8 py-3 flex items-center justify-around md:hidden z-20">
        {/* Only show the first 5 items for mobile nav */}
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className="p-2"
            title={item.label}
          >
            <item.icon className={`w-7 h-7 transition-colors ${
              selectedNav === item.id ? 'text-black' : 'text-gray-400'
            }`} />
          </button>
        ))}
      </nav>
    </div>
  );
}

