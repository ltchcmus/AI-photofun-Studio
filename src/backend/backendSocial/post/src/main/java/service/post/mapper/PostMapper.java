package service.post.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import service.post.DTOs.request.CreatePostRequest;
import service.post.DTOs.response.CreatePostResponse;
import service.post.DTOs.response.CreateVideoPostResponse;
import service.post.DTOs.response.GetPostResponse;
import service.post.entity.Post;

@Mapper(componentModel = "spring")
public interface PostMapper {
    Post toPost(CreatePostRequest createPostRequest);
    CreatePostResponse toCreatePostResponse(Post post);
    @Mapping(target = "createdAt", ignore = true)
    GetPostResponse toGetPostResponse(Post post);
    CreateVideoPostResponse toCreateVideoPostResponse(Post post);
}
