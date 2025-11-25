








{/* 




				<div className="ProposalsReviewsTrustScoreColumn">
					<div className="ProposalsReviewsTrustScorerow1">
						<span>Votes Up</span>
						<span>Votes Down</span>
					</div>

					<div className="ProposalsReviewsTrustScorerow2">
						<span>{proposal && proposal?.votesUp   ? proposal.votesUp : 'n/a'} </span>
						<span>{proposal && proposal?.votesDown   ? proposal.votesDown : 'n/a'}</span>
					</div>
				</div>

 */}



















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












































  //     const resp = await createProposal({ variables });
  //     console.log("GraphQL mutation response:", resp);

  //     const data = resp?.data ?? null;

  //     const created =
  //       data?.createProposal === true ||
  //       (data?.createProposal && typeof data.createProposal === "object") ||
  //       (data && Object.keys(data).length > 0);

  //     if (created) {
  //       setFlowStatus("CONFIRMED");
  //     } else {
  //       setFlowStatus(payload.status === "AWAITING_CONFIRMATIONS" ? "AWAITING_CONFIRMATIONS" : "MANUAL_REVIEW");
  //     }

  //   } catch (err) {
  //     // network/backend error - leave it to backend job to retry later; mark manual review
  //     setFlowStatus("MANUAL_REVIEW");
  //     console.error("Failed to call GraphQL verification payload to backend:", err);
  //     alert("Failed to send verification to backend. Record may still exist on-chain");
  //   } finally {
  //     setIsSubmitting(false);
  //   }

  //   // Optional: clear form fields if you want (or keep for retry/edits)
  //   setTitledata("");
  //   setDescriptionBody("");
  //   setMissionBody("");
  //   setBudgetBody("");
  //   setImplementBody("");
  //   // setImageUrl(null);
  //   // setAvatarFile(null);
  // };







  // try {