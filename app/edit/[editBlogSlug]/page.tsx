"use client";
import BlogDemo from "@/components/BlogDemo";
import dynamic from "next/dynamic";
import React, {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import blogStore from "@/zustand-store/blogStore/Blog";
function page({ params }: { params: { editBlogSlug: string } }) {
  const { getBlog, fetching, fetchingError, blog } = blogStore();
  const [file, setFile] = useState<any>(null);
  const [text, setText] = useState<string>("");
  const [heading, setHeading] = useState<string>("");
  const [imageError, setImageError] = useState<boolean>(false);
  const [imageSizeError, setImageSizeError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const fileRef: React.RefObject<HTMLInputElement> = useRef(null);
  const router = useRouter();
  const [content, setContent] = useState("");

  const config: any = useMemo(
    () => ({
      readonly: false,
      placeholder: "Blog Description | Text goes here....",
    }),
    []
  );
  useEffect(() => {
    const fetchBlog = async () => {
      await getBlog(params.editBlogSlug);
     
    };
       fetchBlog();
    
  }, []);
  useEffect(()=> {
    setText(blog?.text);
    setHeading(blog?.heading);
    setImageUrl(blog?.image);
  }, [blog])
  // on file button click
  const onPickFile = () => {
    fileRef.current?.click();
  };
  // when image is selected
  const imageUploadHandler = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (file) {
      if (file.type !== "image/png") {
        setImageError(true);
        return;
      }
      if (file.size > 103000) {
        setImageSizeError(true);
      }
      setImageSizeError(false);
      setImageError(false);
      console.log(file);
      setFile(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };
  const onAddBlogHandle = async () => {
    
    const userData = Cookies.get("user");
    const user = JSON.parse(userData);
    setLoading(true);
    const blogResp = await fetch(
      process.env.NEXT_PUBLIC_BACKEND_URL + "blog/update/"+blog?._id,
      {
        method: "PATCH",headers: {
          authorization: "Bearer " + user.token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({text, heading}),
        
      }
    );
    console.log(blogResp);
    if (!blogResp.ok) {
      const blogData = await blogResp.json();
      setLoading(false);
      alert(blogData?.message);
      return;
    }
    const blogData = await blogResp.json();
    console.log(blogData)
    if (blogData.status === false) {
      setLoading(false);
      alert(blogData?.message);
      return;
    }
    setLoading(false);
    
    router.push("/blog/posts");
  };
  return (
    <div className="min-h-screen max-w-screen-xl mx-auto mt-20 grid md:grid-cols-2 grid-cols-1 justify-center gap-4">
      <div className="bg-white flex flex-col justify-start items-center rounded-md p-5">
        <input
          type="file"
          className="hidden"
          ref={fileRef}
          onChange={imageUploadHandler}
        />
        <button
          onClick={onPickFile}
          className="bg-gray-200 border-2 border-black rounded-md p-2"
        >
          Upload Cover Image
        </button>
        <div className="py-3">
          {imageError && (
            <p className="text-red-500 text-sm">
              * Image has unsupported type. only PNG.
            </p>
          )}
          {imageSizeError && (
            <p className="text-red-500 text-sm">
              * Image must be less than 100KB.
            </p>
          )}
        </div>
        <input
          onChange={(e) => setHeading(e.target.value)}
          value={heading}
          className="outline-none p-2 bg-gray-50 w-full border-gray-100 border-2"
          placeholder="Enter heading..."
        />
        <JoditEditor
          value={text}
          config={config}
          onBlur={(newContent) => setContent(newContent)} // preferred to use only this option to update the content for performance reasons
          onChange={(newContent) => setText(newContent)} // preferred
          // @ts-ignore
          tabIndex={2}
          className="w-full my-5 mx-auto break-words"
        />
        <div className="py-3 w-full">
          <button
            onClick={onAddBlogHandle}
            className="bg-indigo-500 text-white w-full py-2 rounded"
          >
            {loading ? "Please wait..." : "Edit Blog"}
          </button>
        </div>
      </div>
      {/* preview */}
      <div className="bg-white w-full rounded-md">
        <BlogDemo image={imageUrl} text={text} heading={heading} />
      </div>
    </div>
  );
}

export default page;
