package content;


import java.util.List;
import java.util.Optional;

import content.visitor.ContentVisitor;



public class StringContent extends Content<String> {


		private StringContent(String s, Author a) {
			super.setContent(s);
			super.setAuthor(a);
			super.setLinks(List.of());
			super.setVersion(Optional.empty());
		}
	
	@Override
	public <T> void link(Content<T> c) {

		Link<StringContent, Content<T>> newLink = Link.getNewLink(this, c);

		this.addLink(newLink);

		c.addLink(newLink);

	}
	
	@Override
	public <W> W accept(ContentVisitor<W> contentVisitor) {
		return contentVisitor.visitStringContent(this);
	}
	
	public static class builder extends Content.builder<Content<String>> {
		
		private Author a;
		private String s;
		
		public StringContent build() {
			StringContent newContent = new StringContent(s, a);
			newContent.version();
			a.addPublishedContent(newContent);
			return newContent;
			
		}
		@Override
		public StringContent buildFrom(Content<String> content) {
			StringContent newContent = new StringContent(content.show(), content.author());
			newContent.setVersion(Optional.of(content.version().getChildVersion()));
			return newContent;
		}
		
		public builder withContent(String s) {
			this.s = s;
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
