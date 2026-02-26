package content;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Author {

	private String name;
	private Collection<Content<?>> publishedContent;

	public String getName() {
		return name;
	}

	public Collection<Content<?>> getPublishedContent() {
		return publishedContent;
	}

	private Author(String name) {
		this.name = name;
		this.publishedContent = List.of();
	}

	public void addPublishedContent(Content<?> content) {
		this.publishedContent = Stream.concat(publishedContent.stream(), Stream.of(content)).distinct()
				.collect(Collectors.toList());
	}

	public static Author getNewAuthor(String name) {
		return new Author(name);
	}

}
