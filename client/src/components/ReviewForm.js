import { useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import ProfileNavBar from "./ProfileNavBar";
import NavBar from "./NavBar";

export default function ReviewForm() {
  const [fullName, setFullName] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [description, setDescription] = useState("");
  const [redirect, setRedirect] = useState(false);

  async function submitReview(e) {
    e.preventDefault();

    const reviewData = {
      fullName,
      checkIn,
      checkOut,
      description,
    };

    await axios.post("/review", {
      reviewData,
    });

    setRedirect(true);
  }

  if (redirect) {
    return <Navigate to="../profile/reviews" />;
  }

  return (
    <>
      <NavBar />
      {/* Add your background image or styling here */}
      <ProfileNavBar />
      <div className="flex justify-center w-full mt-10">
        <div className="w-3/5 border py-2 px-6">
          <form onSubmit={submitReview}>
            {/* Full Name Input */}
            <div className="mt-4">
              <h2 className="text-2xl">Full Name</h2>
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border rounded-md py-1 pl-2"
              />
            </div>

            {/* Check-In and Check-Out Inputs */}
            <div className="grid mt-4 gap-2 grid-cols-2">
              <div>
                <h2 className="text-2xl">Check-In</h2>
                <input
                  type="text"
                  placeholder="Check-In Date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full border rounded-md py-1 pl-2"
                />
              </div>
              <div>
                <h2 className="text-2xl">Check-Out</h2>
                <input
                  type="text"
                  placeholder="Check-Out Date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full border rounded-md py-1 pl-2"
                />
              </div>
            </div>

            {/* Review Description */}
            <div className="mt-4">
              <h2 className="text-2xl">Review Description</h2>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write your review here..."
                className="border rounded-md w-full py-2 pl-2 h-[150px]"
              />
            </div>

            <div>
              <button className="bg-secondary_500 text-white my-4 py-2 px-8 rounded-md font-semibold">
                Submit Review
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
