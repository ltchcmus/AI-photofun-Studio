import React from "react";
import {
  Calendar,
  Clock,
  Download,
  Eye,
  Globe,
  Heart,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Share2,
} from "lucide-react";

const profileStats = [
  { label: "Images Created", value: "128" },
  { label: "Followers", value: "2.5K" },
  { label: "Following", value: "428" },
];

const contactDetails = [
  {
    id: "email",
    label: "Email",
    value: "caoty113@gmail.com",
    icon: Mail,
  },
  {
    id: "phone",
    label: "Phone Number",
    value: "+84 912 345 678",
    icon: Phone,
  },
];

const locationDetails = [
  {
    id: "address",
    label: "Address",
    value: "123 Nguyễn Huệ Street, District 1, Ho Chi Minh City",
    icon: MapPin,
  },
  { id: "country", label: "Country", value: "Vietnam", icon: Globe },
];

const personalDetails = [
  { id: "dob", label: "Date of Birth", value: "May 01, 2005", icon: Calendar },
  {
    id: "created",
    label: "Account Created",
    value: "November 12, 2025",
    icon: Clock,
  },
];

const galleryStats = [
  {
    id: "total",
    label: "Total Images",
    value: "128",
    delta: "+12 this month",
    colors: "from-blue-50 to-blue-100 text-blue-900",
    deltaColor: "text-blue-600",
    icon: ImageIcon,
  },
  {
    id: "likes",
    label: "Likes Received",
    value: "2.4K",
    delta: "+340 this month",
    colors: "from-red-50 to-red-100 text-red-900",
    deltaColor: "text-red-600",
    icon: Heart,
  },
  {
    id: "downloads",
    label: "Downloads",
    value: "856",
    delta: "+128 this month",
    colors: "from-green-50 to-green-100 text-green-900",
    deltaColor: "text-green-600",
    icon: Download,
  },
  {
    id: "views",
    label: "Profile Views",
    value: "12.5K",
    delta: "+2.1K this month",
    colors: "from-purple-50 to-purple-100 text-purple-900",
    deltaColor: "text-purple-600",
    icon: Eye,
  },
];

const recentWorks = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&h=600&fit=crop",
];

const Profile = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <section className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <img
            src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&h=400&fit=crop"
            alt="Cao Ty avatar"
            className="w-32 h-32 rounded-2xl object-cover"
          />

          <div className="flex-1 w-full">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl font-bold">Cao Ty</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Digital artist · AI creative explorer
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {profileStats.map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-6 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-gray-900"
                >
                  Edit Profile
                </button>
                <button
                  type="button"
                  className="px-6 py-2.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Contact Information</h2>
          <div className="space-y-4">
            {contactDetails.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  <p className="text-xs uppercase text-gray-500 font-semibold mb-2">
                    {item.label}
                  </p>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-800">
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">Location</h2>
          <div className="space-y-4">
            {locationDetails.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  <p className="text-xs uppercase text-gray-500 font-semibold mb-2">
                    {item.label}
                  </p>
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-600 mt-0.5" />
                    <span className="text-sm font-medium text-gray-800">
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalDetails.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                <p className="text-xs uppercase text-gray-500 font-semibold mb-2">
                  {item.label}
                </p>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Icon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-800">
                    {item.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-6">Gallery Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {galleryStats.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`rounded-xl p-4 bg-gradient-to-br ${item.colors}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-600 font-semibold">
                    {item.label}
                  </p>
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <p className="text-3xl font-bold">{item.value}</p>
                <p className={`text-xs mt-2 ${item.deltaColor}`}>
                  {item.delta}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Recent Works</h2>
          <button
            type="button"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentWorks.map((url, index) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-xl aspect-square"
            >
              <img
                src={url}
                alt={`Recent work ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Profile;
