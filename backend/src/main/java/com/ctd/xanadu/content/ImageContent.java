package com.ctd.xanadu.content;


import java.util.List;
import java.util.Optional;

import com.ctd.xanadu.content.visitor.ContentVisitor;



public class ImageContent extends Content<String> {


		private ImageContent(String url, Author a) {
			super.setContent(url);
			super.setAuthor(a);
			super.setLinks(List.of());
			super.setVersion(Optional.empty());
		}

	@Override
	public <T> void link(Content<T> c) {

		Link<ImageContent, Content<T>> newLink = Link.getNewLink(this, c);

		this.addLink(newLink);

		c.addLink(newLink);

	}

	@Override
	public <W> W accept(ContentVisitor<W> contentVisitor) {
		return contentVisitor.visitImageContent(this);
	}

	public static class builder extends Content.builder<Content<String>> {

		private Author a;
		private String url;

		public ImageContent build() {
			ImageContent newContent = new ImageContent(url, a);
			newContent.version();
			a.addPublishedContent(newContent);
			return newContent;

		}
		@Override
		public ImageContent buildFrom(Content<String> content) {
			ImageContent newContent = new ImageContent(content.show(), content.author());
			newContent.setVersion(Optional.of(content.version().getChildVersion()));
			return newContent;
		}

		public builder withContent(String url) {
			this.url = url;
			return this;
		}

		public builder withAuthor(Author a) {
			this.a = a;
			return this;
		}

		public static builder get() {
			return new builder();
		}


	}

}
