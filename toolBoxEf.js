







// interface Post {
//   id: number;
//   title: string;
//   description: string;
//   mission: string;
//   budget: string;
//   implement: string;
//   votesUp: number;
//   votesDown: number;
//   shareMore: number;
//   dateCreated: Date;
//   avatar: string;
//   avatarUrl?: string;
//   category: string[];
// }







  // const [post, setPost] = useState<Post | null>(null);



  const PostData = async (
    Titledata: string,
    DescriptionBody: string,
    MissionBody: string,
    BudgetBody: string,
    ImplementBody: string,
    currentDate: Date,
    avatarFile: File | null,
    categoryType: string
  ) => {
    try {
      const formData = new FormData();
      formData.append("title", Titledata);
      formData.append("description", DescriptionBody);
      formData.append("mission", MissionBody);
      formData.append("budget", BudgetBody);
      formData.append("implement", ImplementBody);
      formData.append("dateCreated", currentDate.toISOString());
      formData.append("category[]", categoryType);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }
      console.log(
        "F-Inside CreateProposal.tsx  -- PostData --, avatarFile variable holds:",
        avatarFile
      );

      const response = await axios.post(
        "http://localhost:5000/proposals/create",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("F - CreateProposal -- useEffect -- formData: ", formData);

      setPost(response.data);
      console.log("F-Inside CreateProposal.tsx, response variable:", response);
    } catch (err: any) {
      console.error("Error fetching posts:", err.message || err);
    }
  };

  useEffect(() => {
    console.log("F - CreateProposal -- useEffect -- posts: ", post);
  }, [post]);














{/* 

        <input type="file" onChange={handleAvatarUpload} accept="image/*" />

        <div className="CreateProposalsChannelCardLogoColumn">
          {post && post.avatar && (
            <img
              src={`http://localhost:5000/proposals/image/${post.avatar}`}
              alt="Avatar"
            />
          )}

          {!post && imageUrl && <img src={imageUrl} alt="Avatar" />}

          {!avatarFile && <img src={"/aks/C12.png"} alt="" />}
        </div>

 */}







  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setAvatarFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };














const MUTATION_CREATE_PROPOSAL = gql`
mutation createProposal($category: String!, $title: String!, $description: String!, $mission: String!, $budget: String!, $implement: String!, $created_at: String!) {
  createProposal(category: $category, title: $title, description: $description, mission: $mission, budget: $budget, implement: $implement, created_at: $created_at)
  }
`;





