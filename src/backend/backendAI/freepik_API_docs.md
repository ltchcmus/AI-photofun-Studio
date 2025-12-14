giúp tôi tạo 1 markdown document (bọc trong môi trường code để có thể copy nhanh, hoặc có thể trả cho tôi 1 file API_doc.md) mô tả cách dùng các api sau:

đây là api dùng để up ảnh (service mà chúng tôi tự deploy để lưu trữ ảnh, dùng để lưu ảnh và lấy url lưu vào generated image):
import requests
import uuid

url = "https://file-service-cdal.onrender.com/api/v1/file/uploads"

# Sinh UUID mới
generated_id = str(uuid.uuid4())

# form-data
data = {
    "id": generated_id
}
files = {
    "image": open("/home/imdeeslt/Downloads/1.jpg", "rb")
}

response = requests.post(url, data=data, files=files)

print("Generated UUID:", generated_id)
print("Status code:", response.status_code)
print("Response JSON:", response.json())


đây là các API feature sinh ảnh:
API Key freepik của tôi: FPSX66c28e0d80af9f0e2e80d89ee01e834c

Mystic
Create image from text - Mystic
Convert descriptive text input into images using AI. This endpoint accepts a variety of parameters to customize the generated images.

POST
/
v1
/
ai
/
mystic

Try it
​
Important
Mystic image generation mode is Freepik’s exclusive advanced AI workflow for ultra-realistic, high-resolution images.
Make sure you get your webhook set up on every request in order to retrieve your generations.
Authorizations
​
x-freepik-api-key
stringheaderrequired
Your Freepik API key. Required for authentication. Learn how to obtain an API key

Body
application/json
Model Compatibility and LoRA Usage
The Mystic API supports different model configurations with varying LoRA compatibility:

LoRA-Compatible Configuration:

Use the default model (no model field specified)
No structure_reference or style_reference provided
LoRAs can be used via:
Character syntax in prompt: @character_name or @character_name::strength
styling.characters array
styling.styles array
LoRA-Incompatible Configurations:

Specific Models: fluid, flexible , super_real and editorial_portraits models ignore all LoRAs
Structure Reference: When structure_reference is provided, LoRAs are ignored
Style Reference: When style_reference is provided, LoRAs are ignored
Combined References: When both structure_reference and style_reference are provided, LoRAs are ignored
Important: The API will not return errors for incompatible combinations. Instead, LoRAs will be silently ignored, and the request will proceed with the selected model configuration.

​
prompt
string
AI Model Prompt Description
The prompt is a short text that describes the image you want to generate. It can range from simple descriptions, like "a cat", to detailed scenarios, such as "a cat with wings, playing the guitar, and wearing a hat". If no prompt is provided, the AI will generate a random image.

Adding Characters to the Prompt
You can introduce characters into the prompt using the following syntax:

@character_name: Represents the character you want to include. Example: My friend @john is a great artist.
Modifying Character Strength
To adjust the influence or "strength" of a character in the image, use the following syntax:

@character_name::strength: Specify the character's strength by appending ::strength to their name, where strength is a numerical value. Example: My friend @john::200 is a great artist.
Higher strength values will make the character more prominent in the generated image.

​
webhook_url
string<uri>
Optional callback URL that will receive asynchronous notifications whenever the task changes status. The payload sent to this URL is the same as the corresponding GET endpoint response, but without the data field.

Example:
"https://www.example.com/webhook"

​
structure_reference
string<byte>
Structure Reference
Base64 image to use as structure reference. Using images as structure references allows you to influence the shape of your final image. This feature enables various creative applications such as coloring sketches, transforming cartoons into realistic images, texturing basic 3D models, or converting real images into cartoons. The outcome is entirely controlled by your prompt, offering limitless creative possibilities.

​
structure_strength
integerdefault:50
Note: This parameter only takes effect when a "structure_reference" image is provided.
Allows to maintain the structure of the original image.

Required range: 0 <= x <= 100
​
style_reference
string<byte>
Style Reference
Base64 image to use as style reference. Using images as style references allows you to influence the aesthetic of your creation. This is possibly the most powerful tool of Mystic, as it truly lets you create incredibly unique images.

​
adherence
integerdefault:50
Note: This parameter only takes effect when a "style_reference" image is provided.
Increasing this value will make your generation more faithful to the prompt, but it may transfer the style a bit less accurately. Higher values can help fix small artifacts, anatomical errors and text readability. Lower values will give you more creative images and closer to the style reference.

Required range: 0 <= x <= 100
​
hdr
integerdefault:50
Note: This parameter only takes effect when a "style_reference" image is provided.
Increasing this value can give you a more detailed image, at the cost of a more 'AI look' and slightly worse style transfer. Lower values have a more natural and artistic look but may increase artifacts.

Required range: 0 <= x <= 100
​
resolution
enum<string>default:2k
Resolution of the image

Available options: 1k, 2k, 4k 
​
aspect_ratio
enum<string>default:square_1_1
Image size with the aspect ratio. The aspect ratio is the proportional relationship between an image's width and height, expressed as *_width_height (e.g., square_1_1, widescreen_16_9). It is calculated by dividing the width by the height.

If not present, the default is square_1_1.
Note: For the fluid model, only this values are valid:

square_1_1
social_story_9_16
widescreen_16_9
traditional_3_4
classic_4_3
Available options: square_1_1, classic_4_3, traditional_3_4, widescreen_16_9, social_story_9_16, smartphone_horizontal_20_9, smartphone_vertical_9_20, standard_3_2, portrait_2_3, horizontal_2_1, vertical_1_2, social_5_4, social_post_4_5' 
Example:
"square_1_1"

​
model
enum<string>default:realism
zen - for smoother, basic, and cleaner results. Fewer objects in the scene and less intricate details. The softer looking one.

flexible - good prompt adherence. However, it has results that are a bit more HDR and saturated than Realism or Fluid. It's especially good with illustrations, fantastical prompts, and for diving into the latent space in search of very specific visual styles.

fluid - the model that adheres best to prompts with great average quality for all kind of images. It can generate really creative images! It will always follow your input no matter what. However, since it is using Google's Imagen 3, it is a bit over-moderated, and some simple prompts containing words like "war" may be flagged and not generated (sorry about that! But there's nothing we can do!).

realism - with a more realistic color palette. It tries to give an extra boost of reality to your images, a kind of "less AI look". Works especially well with photographs but also magically works with illustrations too. IMPORTANT: you should use Zen, Flexible or Fluid if you are trying to generate something that is really fantastic or a known character, Realism may not follow your prompt well.

super_real - if reality is your priority, this is your model. Nearly as versatile as Flexible, it excels in realism outperforming Editorial Portraits in medium shots, though not as strong for close-ups.

editorial_portraits - the most amazing state-of-the-art generator for editorial portraits. You have never seen a level of realism like this before. Perfect for hyperrealistic close-up or medium shots. Unfortunately, in wide or distant shots, it generates anatomical problems and artifacts... but for close-ups, it is simply the best on the market. Tip: use the longest and most explanatory prompts possible, they really suit it well!

Available options: realism, fluid, zen, flexible, super_real, editorial_portraits 
​
creative_detailing
integerdefault:33
Higher values can achieve greater detail per pixel at higher resolutions at the cost of giving a somewhat more "HDR" or artificial look.
Very high values can generate quite crazy things like eyes where they shouldn't appear, etc.

Valid values range [0, 100], default 33

Required range: 0 <= x <= 100
​
engine
enum<string>default:automatic
Select the engine for the AI model. Available options:

automatic - default choice
Illusio - for smoother illustrations, landscapes, and nature. The softer looking one.
Sharpy - better for realistic images like photographs and for a more grainy look. It provides the sharpest and most detailed images. If you use it for illustrations it will give them more texture and a less softer look.
Sparkle - also good for realistic images. It's a middle ground between Illusio and Sharpy.
Available options: automatic, magnific_illusio, magnific_sharpy, magnific_sparkle 
​
fixed_generation
booleandefault:false
When this option is enabled, using the same settings will consistently produce the same image.
Fixed generations are ideal for fine-tuning, as it allows for incremental changes to parameters (such as the prompt) to see subtle variations in the output.
When disabled, expect each generation to introduce a degree of randomness, leading to more diverse outcomes.

​
filter_nsfw
booleandefault:true
Controls NSFW (Not Safe For Work) content filtering during generation.

This parameter is always set to true by default and NSFW filtering cannot be disabled for standard API usage. Only authorized clients with special permissions can disable this filter.

Important: If your use case requires disabling NSFW filtering, please contact our support team to discuss your requirements and potential authorization.

​
styling
object
Styling options for the image

Show child attributes

Response

200

application/json
OK - The request has succeeded and the Mystic process has started.

​
data
objectrequired
Show child attributes

Example:
{
  "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "status": "CREATED",
  "generated": [
    "https://openapi-generator.tech",
    "https://openapi-generator.tech"
  ]
}

(Beta) Reimagine Flux
(Beta, synchronous) Reimagine Flux is a new AI model that allows you to generate images from text prompts.

POST
/
v1
/
ai
/
beta
/
text-to-image
/
reimagine-flux

Try it
Authorizations
​
x-freepik-api-key
stringheaderrequired
Your Freepik API key. Required for authentication. Learn how to obtain an API key

Body
application/json
​
image
string<byte>required
Base64 image to do the reimagination

​
prompt
string
Example:
"A beautiful sunset over a calm ocean"

​
webhook_url
string<uri>
Optional callback URL that will receive asynchronous notifications whenever the task changes status. The payload sent to this URL is the same as the corresponding GET endpoint response, but without the data field.

Example:
"https://www.example.com/webhook"

​
imagination
enum<string>
Imagination type

Available options: wild, subtle, vivid 
​
aspect_ratio
enum<string>default:original
Image size with the aspect ratio. The aspect ratio is the proportional relationship between an image's width and height, expressed as *_width_height (e.g., square_1_1, widescreen_16_9). It is calculated by dividing the width by the height.

If not present, the default is original.

Available options: original, square_1_1, classic_4_3, traditional_3_4, widescreen_16_9, social_story_9_16, standard_3_2, portrait_2_3, horizontal_2_1, vertical_1_2, social_post_4_5 
Response

200

application/json
Success - The image has been generated

​
task_id
string<uuid>required
Task identifier

​
status
enum<string>required
Task status

Available options: CREATED, IN_PROGRESS, COMPLETED, FAILED 
​
generated
string<uri>[]required
URL of the generated image

Was this page helpful?


Yes

No
Remove the background of an image
Get the status of all image expand tasks
Ask a question...

Image Expand API
Image expand using AI Flux Pro
This endpoint allows you to expand an image using the AI Flux Pro model. The image will be expanded based on the provided parameters.

POST
/
v1
/
ai
/
image-expand
/
flux-pro

Try it
Authorizations
​
x-freepik-api-key
stringheaderrequired
Your Freepik API key. Required for authentication. Learn how to obtain an API key

Body
application/json
​
image
string<byte>required
Base64 image to expand

​
webhook_url
string<uri>
Optional callback URL that will receive asynchronous notifications whenever the task changes status. The payload sent to this URL is the same as the corresponding GET endpoint response, but without the data field.

Example:
"https://www.example.com/webhook"

​
prompt
string
The description of the changes you want to make. This text guides the expansion process, allowing you to specify features, styles, or modifications for the expanded areas.

​
left
integer | null
Pixel to expand on the left

Required range: 0 <= x <= 2048
​
right
integer | null
Pixel to expand on the right

Required range: 0 <= x <= 2048
​
top
integer | null
Pixel to expand on the top

Required range: 0 <= x <= 2048
​
bottom
integer | null
Pixel to expand on the bottom

Required range: 0 <= x <= 2048
Response

200

application/json
OK - The task exists and the status is returned

​
data
objectrequired
Show child attributes

Example:
{
  "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "status": "CREATED",
  "generated": [
    "https://openapi-generator.tech",
    "https://openapi-generator.tech"
  ]
}

Remove Background
Remove the background of an image
This endpoint removes the background from an image provided via a URL. The URLs in the response are temporary and valid for 5 minutes only.

POST
/
v1
/
ai
/
beta
/
remove-background

Try it
Authorizations
​
x-freepik-api-key
stringheaderrequired
Your Freepik API key. Required for authentication. Learn how to obtain an API key

Body
application/x-www-form-urlencoded
​
image_url
string<uri>
The URL of the image whose background needs to be removed.

Example:
"https://img.freepik.com/free-vector/cute-cat-sitting-cartoon-vector-icon-illustration-animal-nature-icon-concept-isolated-premium-vector-flat-cartoon-style_138676-4148.jpg?w=2000&t=st=1725353998~exp=1725357598~hmac=a17f90afeeff454b36c0715f84eed2b388cd9c4a7ce59fcdff075fa41770e469"

Response
200 - application/json
Successful background removal.

​
original
string<uri>
URL of the original image.

​
high_resolution
string<uri>
URL of the high-resolution image with the background removed.

​
preview
string<uri>
URL of the preview version of the image.

​
url
string<uri>
Direct URL for downloading the high-resolution image.

Style Transfer - Magnific API
Style transfer an image using AI
POST
/
v1
/
ai
/
image-style-transfer

Try it
Authorizations
​
x-freepik-api-key
stringheaderrequired
Your Freepik API key. Required for authentication. Learn how to obtain an API key

Body
application/json
​
image
stringrequired
Base64 or URL of the image to do the style transfer

​
reference_image
stringrequired
Base64 or URL of the reference image for style transfer

​
webhook_url
string<uri>
Optional callback URL that will receive asynchronous notifications whenever the task changes status. The payload sent to this URL is the same as the corresponding GET endpoint response, but without the data field.

Example:
"https://www.example.com/webhook"

​
prompt
string
Prompt for the AI model

​
style_strength
integerdefault:100
Percentage of style strength

Required range: 0 <= x <= 100
​
structure_strength
integerdefault:50
Allows to maintain the structure of the original image

Required range: 0 <= x <= 100
​
is_portrait
booleandefault:false
Indicates whether the image should be processed as a portrait. When set to true, portrait-specific enhancements such as style and beautification can be applied.

​
portrait_style
enum<string>default:standard
Optional setting to define the visual style applied to portrait images. Only used if is_portrait is true. The available options adjust the stylization level or aesthetic treatment of the portrait.

Available options: standard, pop, super_pop 
​
portrait_beautifier
enum<string>
Optional setting to enable facial beautification on portrait images. Only used if is_portrait is true. Options control the intensity or type of beautification applied.

Available options: beautify_face, beautify_face_max 
​
flavor
enum<string>default:faithful
Flavor of the transferring style

Available options: faithful, gen_z, psychedelia, detaily, clear, donotstyle, donotstyle_sharp 
​
engine
enum<string>default:balanced
Available options: balanced, definio, illusio, 3d_cartoon, colorful_anime, caricature, real, super_real, softy 
​
fixed_generation
booleandefault:false
When this option is enabled, using the same settings will consistently produce the same image.
Fixed generations are ideal for fine-tuning, as it allows for incremental changes to parameters (such as the prompt) to see subtle variations in the output.
When disabled, expect each generation to introduce a degree of randomness, leading to more diverse outcomes.

Response

200

application/json
OK - The request has succeeded and the Style Transfer process has started.

​
task_id
string<uuid>required
Task identifier

​
task_status
enum<string>required
Task status

Available options: IN_PROGRESS, CREATED, COMPLETED, FAILED 
​
generated
string<uri>[]required
URL of the generated image

Relight - Magnific API
Relight an image
Relight an image using AI. This endpoint accepts a variety of parameters to customize the generated images.

POST
/
v1
/
ai
/
image-relight

Try it
​
Important
Upscaler endpoints are only available for premium API users. You can upgrade your account here.
​
Request
Authorizations
​
x-freepik-api-key
stringheaderrequired
Your Freepik API key. Required for authentication. Learn how to obtain an API key

Body
application/json
​
image
stringrequired
Base64 or URL of the image to do the relight

​
webhook_url
string<uri>
Optional callback URL that will receive asynchronous notifications whenever the task changes status. The payload sent to this URL is the same as the corresponding GET endpoint response, but without the data field.

Example:
"https://www.example.com/webhook"

​
prompt
string
You can guide the generation process and influence the light transfer with a descriptive prompt. For example, if the reference image is a brightly lit scene, adding something like "A sunlit forest clearing at golden hour" will be helpful.

You can also use your imagination to alter lighting conditions in images: transforming a daytime scene into a moonlit night, enhancing the warmth of a sunset, or even dramatic changes like casting shadows of towering structures across a cityscape.

IMPORTANT: You can emphasize specific aspects of the light in your prompt by using a number in parentheses, ranging from 1 to 1.4, like "(dark scene:1.3)".

​
transfer_light_from_reference_image
string
Base64 or URL of the reference image for light transfer. Incompatible with 'transfer_light_from_lightmap'

​
transfer_light_from_lightmap
string
Base64 or URL of the lightmap for light transfer. Icompatible with 'transfer_light_from_reference_image'

​
light_transfer_strength
integerdefault:100
It allows you to specify the level of light transfer, meaning the intensity that your prompt, reference image, or lightmap will have. A value of 0% will keep your image closest to the original, while 100% represents the maximum possible light transfer.

If you enable "Interpolate from original", lower values on this slider will make the result even more similar to your original image.
Valid values range [0, 100], default 100

Required range: 0 <= x <= 100
​
interpolate_from_original
booleandefault:false
When enabled, this feature will make your final image interpolate from the original using the "Light transfer strength" slider, at the cost of sometimes restricting the generation's freedom.

If disabled, the generation will be freer and will generally produce better results. However, for example, if you want to generate all the frames of a video where a room transitions from having the lights off and very dim lighting to gradually becoming fully illuminated as a new day begins, activating this option might be useful (together with gradually ingreasing the "Light transfer strength" slider).

​
change_background
booleandefault:true
When enabled, it will change the background based on your prompt and/or reference image. This is super useful for product placement and portraits. However, don't forget to disable it if your scene is something like a landscape or an interior.

​
style
enum<string>default:standard
Available options: standard, darker_but_realistic, clean, smooth, brighter, contrasted_n_hdr, just_composition 
​
preserve_details
booleandefault:true
It will try to maintain the texture and small details of the original image. Especially good for product photography, texts, etc. Disable it if you prefer a smoother result.

​
advanced_settings
object
Show child attributes

Response

200

application/json
OK - The request has succeeded and the relight process has started.

​
data
objectrequired
Show child attributes

Example:
{
  "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "status": "CREATED",
  "generated": [
    "https://openapi-generator.tech",
    "https://openapi-generator.tech"
  ]
}

Upscaler Precision V1
Upscale with precision an image with Magnific
Upscales an image while adding new visual elements or details. This endpoint may modify the original image content based on the prompt and inferred context.

POST
/
v1
/
ai
/
image-upscaler-precision

Try it
Authorizations
​
x-freepik-api-key
stringheaderrequired
Your Freepik API key. Required for authentication. Learn how to obtain an API key

Body
application/json
​
image
string<byte>required
Base64 image to upscale

​
webhook_url
string<uri>
Webhook URL

​
sharpen
integerdefault:50
Sharpen the image

Required range: 0 <= x <= 100
​
smart_grain
integerdefault:7
Smart grain

Required range: 0 <= x <= 100
​
ultra_detail
integerdefault:30
Ultra detail

Required range: 0 <= x <= 100
Response

200

application/json
OK

​
data
objectrequired
Show child attributes

Example:
{
  "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
  "status": "CREATED",
  "generated": [
    "https://openapi-generator.tech",
    "https://openapi-generator.tech"
  ]
}
