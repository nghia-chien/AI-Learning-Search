# Kịch Bản Kiểm Thử RAG & Bộ Phân Loại Địa Chính Trị (50 Failure Scenarios & Edge Cases)

Tài liệu này tổng hợp **50 kịch bản kiểm thử góc khuất (Edge Cases)** và các nguyên nhân tiềm ẩn có thể làm hệ thống RAG (Retrieval-Augmented Generation), bộ phân loại lĩnh vực và đường ống dịch thuật cho kết quả sai lệch hoặc sập hệ thống.

---

## NÓM 1: LỖI ĐẦU VÀO & TIỀN XỬ LÝ TRUY VẤN (QUERY INPUT & PREPROCESSING)

| STT | Kịch bản / Câu truy vấn mẫu | Hiện tượng lỗi tiềm ẩn | Nguyên nhân kỹ thuật |
|---|---|---|---|
| **01** | `vu khi sieu thanh` (Không dấu) | Bị phân loại thành `tech_ai` hoặc dịch thành "Vu when cool sound". | Lỗi nhận diện chuỗi con (VD: `hiện tại` chứa `ai`). |
| **02** | `AI` (Truy vấn siêu ngắn) | Dịch sang từ khóa tìm kiếm bị biến dạng hoặc kết quả quá rộng. | Từ khóa quá ngắn không đủ ngữ cảnh để Gemini mở rộng. |
| **03** | `Tối muốn tìm hiểu sâu về ảnh hưởng của lệnh trừng phạt kinh tế Mỹ lên đồng Rúp Nga năm 2026 đối với doanh nghiệp VN` | Gemini trích xuất sai từ khóa chính hoặc vượt quá token prompt. | Truy vấn quá dài chứa nhiều thực thể mâu thuẫn (Mỹ, Nga, VN). |
| **04** | `Tencent vs OpenAI ai mạnh hơn?` | Nhận diện sai quốc gia Rank 1 / Rank 2. | Truy vấn chứa 2 thực thể của 2 quốc gia khác nhau (Trung Quốc vs Mỹ). |
| **05** | `Bắc Kinh có định đánh Đài Loan không?` | Bị phân loại vào `culture` hoặc `supply_chain`. | Từ viết tắt/tên địa danh hành chính (`Bắc Kinh` = Trung Quốc, `Đài Loan` = thực thể nhạy cảm). |
| **06** | `Apple sản xuất iPhone tại Ấn Độ` | Gán nhãn Mỹ nhưng tìm kiếm không ra thông tin Ấn Độ. | Thực thể công ty Mỹ (`Apple`) hoạt động ở nước thứ 3 (`Ấn Độ`). |
| **07** | `Lãi suất Fed & lạm phát US` | Tiếng Việt trộn tiếng Anh (`US`, `Fed`). | Đa ngôn ngữ lai (Code-switching) làm bộ dịch Google/Gemini bị nhầm ngữ pháp. |
| **08** | `cuộc chiến chip bán dẫn 2026!@#$%^&*()` | Ký tự đặc biệt gây vỡ API request Tavily/Gemini. | Thiếu bước sanitize/clean chuỗi ký tự đặc biệt ở backend. |
| **09** | `DeepSeek-V3 MoE architecture` | Dịch `MoE` (Mixture of Experts) thành từ tiếng Việt không chuẩn làm mất kết quả gốc. | Thuật ngữ chuyên ngành AI khi ép dịch tự động bị biến dạng. |
| **10** | `tình hình kinh tế nga hiện nay` | Nhầm `nga` (quốc gia Russia) với tên người "Nga" hoặc từ "ngã". | Từ đồng âm khác nghĩa khi khôi phục dấu tiếng Việt. |

---

## NHÓM 2: LỖI PHÂN LOẠI LĨNH VỰC & GÁN QUỐC GIA (DOMAIN & ENTITY LINKING)

| STT | Kịch bản / Câu truy vấn mẫu | Hiện tượng lỗi tiềm ẩn | Nguyên nhân kỹ thuật |
|---|---|---|---|
| **11** | `Chiến tranh mạng giữa Mỹ và Trung Quốc` | Lẫn lộn giữa lĩnh vực `military` (Quân sự) và `cybersecurity` (An ninh mạng). | Từ khóa "chiến tranh" kích hoạt Quân sự, nhưng "mạng" thuộc An ninh mạng. |
| **12** | `Cảng biển chiến lược của Nga ở Biển Đen` | Thuộc `supply_chain` hay `military`? | Truy vấn đa lĩnh vực (Thương mại + Quân sự). |
| **13** | `Tên lửa Spacex phóng vệ tinh quân sự` | Nhầm `aerospace` thành `military` hoặc ngược lại. | Thực thể tư nhân (`SpaceX`) làm hợp đồng quốc phòng (`military`). |
| **14** | `Trung Quốc xuất khẩu đất hiếm sang Mỹ` | Nhận diện Mỹ là Rank 1 thay vì Trung Quốc. | Đất hiếm là thế mạnh Trung Quốc (`resources`), nhưng Mỹ là bên mua. |
| **15** | `Khủng hoảng năng lượng Châu Âu` | Không chọn được quốc gia đối sánh (Do Châu Âu không phải Mỹ/Trung/Nga). | Quốc gia đề cập không nằm trong bộ 4 quốc gia cốt lõi (US, CN, RU, VN). |
| **16** | `Lệnh cấm TikTok tại Mỹ` | Phân loại vào `politics` thay vì `culture` hoặc `tech_ai`. | Sự kiện chính trị can thiệp vào nền tảng công nghệ/truyền thông. |
| **17** | `Tập đoàn Gazprom bị đình chỉ cổ phiếu` | Nhầm `finance` thay vì `energy`. | Công ty năng lượng phát hành tài chính. |
| **18** | `Tàu sân bay chạy bằng năng lượng hạt nhân Mỹ` | Nhầm `energy` thay vì `military`. | Từ khóa "năng lượng hạt nhân" đè lên từ khóa "tàu sân bay". |
| **19** | `Việt Nam trong chuỗi cung ứng bán dẫn toàn cầu` | Gán Mỹ/Trung thay vì đưa Việt Nam vào vị trí ưu tiên. | Bộ phân loại chưa hỗ trợ đưa Việt Nam làm Rank 1 khi có từ "Việt Nam". |
| **20** | `Ngoại giao bẫy nợ BRI của Trung Quốc` | Phân loại thành `finance` thay vì `politics`. | Sáng kiến Đai và Đường (BRI) vừa là kinh tế vừa là địa chính trị. |

---

## NHÓM 3: LỖI TÌM KIẾM, DỊCH THUẬT & API NGOẠI VI (RETRIEVAL & TRANSLATION)

| STT | Kịch bản / Câu truy vấn mẫu | Hiện tượng lỗi tiềm ẩn | Nguyên nhân kỹ thuật |
|---|---|---|---|
| **21** | Dịch từ khóa sang tiếng Trung: `DeepSeek` ➔ `深寻` | Tavily Search tại Trung Quốc trả về 0 kết quả. | Tên thương hiệu riêng (`DeepSeek`) bị dịch gượng ép sang chữ Hán thay vì giữ nguyên. |
| **22** | Truy vấn về thông tin mới diễn ra cách đây 1 giờ | Tavily trả về thông tin cũ từ 2024 hoặc không có bài viết. | Độ trễ index dữ liệu của search engine ngoại vi. |
| **23** | Tìm kiếm tài liệu PDF quân sự Nga | Tavily PDF Search trả về file PDF hỏng, không có snippet. | File PDF bị khóa password hoặc chỉ có hình ảnh (scanned PDF). |
| **24** | Tìm kiếm video YouTube tiếng Nga về `Su-57` | YouTube API không trả về video nào có phụ đề tiếng Việt. | Video gốc không có caption hoặc YouTube tự động chặn region code. |
| **25** | Thực hiện 5 lượt tìm kiếm liên tiếp | Lỗi `429 Quota Exceeded` hoặc `503 Service Unavailable`. | Chạm giới hạn Rate Limit của Gemini/Tavily API miễn phí. |
| **26** | Kết quả tìm kiếm trả về các trang web có `Paywall` (Yêu cầu trả phí) | Snippet chỉ vỏn vẹn "Please subscribe to read...". | Tavily crawl phải trang tin trả phí (FT, WSJ, NYT). |
| **27** | Dịch bài báo tiếng Nga về tiếng Việt | Bài dịch bị ngọng ngữ pháp, sai nghĩa câu. | Google Translate gtx bị suy giảm chất lượng với câu phức tiếng Nga. |
| **28** | Kết quả Tavily trả về 10 links trùng lặp domain | RAG bị lặp lại một nguồn duy nhất 10 lần. | Thiếu thuật toán Deduplication (lọc trùng URL/Domain). |
| **29** | Tìm kiếm về "Bán dẫn" tại Nga | Số lượng bài báo quá ít (< 2 kết quả). | Quốc gia đó không mạnh hoặc bị hạn chế thông tin về lĩnh vực này. |
| **30** | YouTube trả về Shorts (< 60s) | Snippet video ngắn không đủ thông tin cho RAG tổng hợp. | API YouTube trả về các video dạng Shorts rác. |

---

## NHÓM 4: LỖI TỔNG HỢP RAG & TẠO CÂU TRẢ LỜI (RAG SYNTHESIS & PROMPTING)

| STT | Kịch bản / Câu truy vấn mẫu | Hiện tượng lỗi tiềm ẩn | Nguyên nhân kỹ thuật |
|---|---|---|---|
| **31** | Nhận 30 nguồn dữ liệu cùng lúc | Lỗi `SyntaxError: Unterminated string in JSON` (Bị cắt ngắt chuỗi). | Dữ liệu đầu vào quá dài khiến Gemini vượt quá `maxOutputTokens`. |
| **32** | AI tạo câu trả lời nhưng gắn trích dẫn `[99]` | Trích dẫn số `[99]` không tồn tại trong danh sách nguồn. | Lỗi Hallucination của LLM khi đánh số index trích dẫn. |
| **33** | Dữ liệu nguồn ghi "Nga phủ nhận tấn công" nhưng AI tổng hợp lại viết "Nga đã tấn công" | AI tổng hợp ngược lại hoàn toàn so với bằng chứng. | LLM suy luận sai từ các câu phủ định phức tạp trong snippet. |
| **34** | Chế độ So sánh (Compare Mode) trả về câu trả lời bằng tiếng Anh | Trả lời sai ngôn ngữ yêu cầu (Tiếng Việt). | System prompt bị đè bởi ngữ cảnh snippet tiếng Anh chiếm đa số. |
| **35** | Nguồn tin A nói "Doanh thu tăng 10%", Nguồn B nói "Doanh thu giảm 5%" | AI bị hoang mang và đưa ra câu trả lời mâu thuẫn tự triệt hạ. | Nguồn tin xung đột (Conflicting Evidence) mà không có trọng tài phân xử. |
| **36** | Trích dẫn `[1]` dẫn đến bài báo A, nhưng nội dung trích dẫn lại thuộc về bài báo B | Lỗi Lệch Ma Trận Trích Dẫn (Citation Misalignment). | Đánh số chỉ mục `idx` bị lệch giữa Prompt Backend và Array Frontend. |
| **37** | Prompt tổng hợp chứa 30 snippets nhưng chỉ dùng đúng 1 snippet để trả lời | Đã bỏ sót 29 nguồn dữ liệu còn lại (Information Loss). | LLM bị hiệu ứng "Lost in the Middle" (chỉ chú ý đầu và cuối prompt). |
| **38** | Nhận câu hỏi mang tính suy đoán tương lai (`Năm 2030 ai sẽ thắng?`) | AI tự bịa ra kịch bản tương lai như thật mà không có nguồn dẫn. | Thiếu câu lệnh ép buộc: "Nếu không có bằng chứng, phải tuyên bố không thể dự đoán". |
| **39** | AI lặp lại câu văn 3-4 lần trong cùng một đoạn | Lỗi Repetitive Loop trong sinh văn bản. | Cấu hình `temperature` quá thấp (0.1) hoặc `frequency_penalty` chưa đặt. |
| **40** | Kết quả RAG không có bất kỳ mốc trích dẫn `[N]` nào | Văn bản phẳng không thể kiểm chứng nguồn gốc. | Gemini quên không tuân thủ quy tắc chèn `[N]` sau mỗi luận điểm. |

---

## NHÓM 5: LỖI CHẾ ĐỘ SO SÁNH 2 CƯỜNG QUỐC (COMPARATIVE MODE & BIAS)

| STT | Kịch bản / Câu truy vấn mẫu | Hiện tượng lỗi tiềm ẩn | Nguyên nhân kỹ thuật |
|---|---|---|---|
| **41** | So sánh Mỹ vs Trung về AI: Mỹ có 10 bài báo, Trung Quốc có 0 bài báo | Bảng so sánh cột Trung Quốc bị trống rỗng hoặc bị sập giao diện. | Thiếu xử lý fallback dữ liệu bất cân xứng (Asymmetric Data Handling). |
| **42** | Cột "Điểm chung" (Common Ground) liệt kê các điểm hoàn toàn trái ngược | Lỗi Logic bảng đối chiếu 3 cột. | LLM xếp nhầm mục `country1Points` vào `commonGround`. |
| **43** | Bảng so sánh 3 cột bị đè chữ, tràn khung trên màn hình di động | Lỗi vỡ giao diện Responsive UI. | Grid 3 cột (`grid-cols-3`) không tự co giãn trên giao diện hẹp. |
| **44** | Tin tức phía Mỹ mang tính thiên vị (Bias Mỹ), tin phía Trung Quốc mang tính tuyên truyền (Bias TQ) | AI Answer bị nghiêng hẳn về một phía và chỉ trích bên còn lại. | RAG chưa có tầng trung hòa góc nhìn (Neutral Perspective Balancing). |
| **45** | Mốc thời gian dữ liệu 2 bên lệch nhau (Mỹ dữ liệu 2026, Trung Quốc dữ liệu 2021) | AI đưa ra so sánh khập khiễng giữa 2 mốc thời gian khác nhau. | Không lọc hoặc cân bằng mốc thời gian xuất bản (`publishedAt`) giữa 2 bên. |
| **46** | So sánh Quân sự Mỹ vs Nga: Cột Nga toàn tiếng Nga未 dịch | Dịch thiếu 1 cột kết quả khi chạy song song 2 Promise. | Một trong hai tiến trình `translateItem` bị reject ẩn. |
| **47** | Cột `country1Points` trả về danh sách rỗng `[]` | Giao diện hiện thẻ trống không có nội dung. | Gemini trả JSON có key nhưng value là array rỗng. |
| **48** | So sánh về chủ đề nhạy cảm chính trị làm Gemini trả lỗi "Safety Block" | API trả lỗi 400 Bad Request do bộ lọc an toàn của Google. | Nội dung tìm kiếm chạm vào bộ lọc nội dung nhạy cảm của Gemini. |
| **49** | Tải song song 2 quốc gia làm thời gian chờ lên tới > 45 giây | Người dùng tưởng ứng dụng bị đơ và tắt trang (High Latency Drop). | Không có Progress Bar từng bước (Loading progress indicator). |
| **50** | Tìm kiếm câu hỏi không liên quan đến so sánh (`Cách nấu phở bò`) ở chế độ Compare | Hệ thống vẫn cố gượng ép chia Phở bò thành góc nhìn Mỹ vs Trung Quốc! | Thiếu bước kiểm tra tính hợp lệ của câu hỏi đối với chế độ So sánh địa chính trị. |

---

## 🛠️ HƯỚNG DẪN SỬ DỤNG BỘ KỊCH BẢN NÀY ĐỂ TỐI ƯU HỆ THỐNG

1. **Chạy Automated Unit Test**: Dùng 50 câu truy vấn trên làm đầu vào cho bộ test tự động để đo tỷ lệ pass/fail của `domainClassifier` và `searchService`.
2. **Cải thiện Prompt Engineering**: Dựa vào các lỗi từ **Nhóm 4 & Nhóm 5** để siết chặt System Prompt của `ragService.ts`.
3. **Nâng cấp UI/UX**: Dựa vào **STT 43, 49** để thêm thanh Progress Bar và responsive layout cho mobile.
