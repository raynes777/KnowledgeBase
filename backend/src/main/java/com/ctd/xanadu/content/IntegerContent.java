package com.ctd.xanadu.content;



import java.util.List;
import java.util.Optional;

import com.ctd.xanadu.content.visitor.ContentVisitor;



public class IntegerContent extends Content<Integer> {




	IntegerContent(Integer i, Author a){
		super.setContent(i);
		super.setLinks(List.of());
		super.setVersion(Optional.empty());
	}

	@Override
	public <R> void link(Content<R> c) {
		Link<IntegerContent, Content<R>> newLink = Link.getNewLink(this, c);

		this.addLink(newLink);

		c.addLink(newLink);

	}

	public static IntegerContent getNewContent(Integer i, Author a) {
		return new IntegerContent(i, a);
	}

	@Override
	public <W> W accept(ContentVisitor<W> contentVisitor) {
		return contentVisitor.visitIntegerContent(this);
	}

	public static class builder extends Content.builder<Content<Integer>> {

		private Author a;
		private Integer i;

		public IntegerContent build() {
			IntegerContent newContent = new IntegerContent(i, a);
			newContent.version();
			a.addPublishedContent(newContent);
			return newContent;
		}

		@Override
		public IntegerContent buildFrom(Content<Integer> content) {
			IntegerContent newContent = new IntegerContent(content.show(), content.author());
			newContent.setVersion(Optional.of(content.version().getChildVersion()));
			return newContent;
		}

		public builder withContent(Integer i) {
			this.i = i;
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
