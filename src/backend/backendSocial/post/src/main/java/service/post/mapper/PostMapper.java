package service.post.mapper;

import org.mapstruct.Mapper;
import service.post.DTOs.request.CreatePostRequest;
import service.post.DTOs.response.CreatePostResponse;
import service.post.entity.Post;

@Mapper(componentModel = "spring")
public interface PostMapper {
    Post toPost(CreatePostRequest createPostRequest);
    CreatePostResponse toCreatePostResponse(Post post);
}
